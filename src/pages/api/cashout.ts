import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { Wallet } from "ethers";
import crypto from "crypto";
import redis from "@/lib/redis";

const MSG_TO_SIGN = "This message attests that I control the given wallet";
type Chain = number;
const CLOB_API = process.env.NEXT_PUBLIC_CLOB_API_URL || "https://clob.polymarket.com";

interface ApiKeyData {
  apiKey: string;
  secret: string;
  passphrase: string;
}

interface Position {
  marketId: string;
  outcome: string;
  size: number;
  price: number;
  tokenID: string;
  wallet: string;
  timestamp: number;
}

// ---------------- Helper Functions ----------------

async function buildClobEip712Signature(
  signer: Wallet,
  chainId: Chain,
  timestamp: string,
  nonce: number
): Promise<string> {
  const domain = { name: "ClobAuthDomain", version: "1", chainId };
  const types = {
    ClobAuth: [
      { name: "address", type: "address" },
      { name: "timestamp", type: "string" },
      { name: "nonce", type: "uint256" },
      { name: "message", type: "string" },
    ],
  };
  const value = { address: await signer.getAddress(), timestamp, nonce, message: MSG_TO_SIGN };
  return signer._signTypedData(domain, types, value);
}

function generateL2HmacSignature(secret: string, timestamp: string, method: string, path: string): string {
  const msg = timestamp + method.toUpperCase() + path;
  return crypto.createHmac("sha256", secret).update(msg).digest("hex");
}

async function fetchPositionFromRedis(wallet: string, marketId: string): Promise<Position | undefined> {
  const redisKey = `orders:${wallet}`;
  const rawPositions = await redis.lrange(redisKey, 0, -1);
  const positions: Position[] = rawPositions.map((o) => JSON.parse(o));
  return positions.find((p) => p.marketId === marketId);
}

async function getBestMarketPrice(apiKeyData: ApiKeyData, signingAddress: string, tokenID: string): Promise<number> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = generateL2HmacSignature(apiKeyData.secret, timestamp, "GET", `/book`);
  const res = await axios.get(`${CLOB_API}/book?token_id=${tokenID}`, {
    headers: {
      POLY_ADDRESS: signingAddress,
      POLY_API_KEY: apiKeyData.apiKey,
      POLY_PASSPHRASE: apiKeyData.passphrase,
      POLY_TIMESTAMP: timestamp,
      POLY_SIGNATURE: signature,
    },
  });

  const bids: { price: string }[] = res.data.bids || [];
  if (bids.length === 0) throw new Error("No liquidity available for cashout");
  return parseFloat(bids[0].price);
}

// ---------------- API Key Helper ----------------
async function getApiKey(signer: Wallet, signingAddress: string): Promise<ApiKeyData> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = Date.now();
  const chainId: Chain = 137;
  const signature = await buildClobEip712Signature(signer, chainId, timestamp, nonce);

  try {
    const deriveRes = await axios.get(`${CLOB_API}/auth/derive-api-key`, {
      headers: {
        POLY_ADDRESS: signingAddress,
        POLY_SIGNATURE: signature,
        POLY_TIMESTAMP: timestamp,
        POLY_NONCE: nonce,
      },
    });
    return deriveRes.data;
  } catch {
    const createRes = await axios.post(`${CLOB_API}/auth/api-key`, {}, {
      headers: {
        POLY_ADDRESS: signingAddress,
        POLY_SIGNATURE: signature,
        POLY_TIMESTAMP: timestamp,
        POLY_NONCE: nonce,
      },
    });
    return createRes.data;
  }
}

// ---------------- Signed Order Creation ----------------
async function createSignedOrder(
  signer: Wallet,
  tokenID: string,
  side: "BUY" | "SELL",
  amount: number,
  price: number
) {
  const salt = BigInt(Date.now()).toString();
  const maker = await signer.getAddress();
  const taker = "0x0000000000000000000000000000000000000000";
  const expiration = Math.floor(Date.now() / 1000) + 300;
  const nonce = Date.now();

  let makerAmount: string;
  let takerAmount: string;
  if (side === "SELL") {
    makerAmount = amount.toString();
    takerAmount = (amount * price * 1_000_000).toString();
  } else {
    makerAmount = (amount * price * 1_000_000).toString();
    takerAmount = amount.toString();
  }

  const order = {
    salt,
    maker,
    signer: maker,
    taker,
    tokenId: tokenID,
    makerAmount,
    takerAmount,
    expiration: expiration.toString(),
    nonce: nonce.toString(),
    feeRateBps: "0",
    side,
    signatureType: 0,
  };

  const domain = {
    name: "Polymarket CTF Exchange",
    version: "1",
    chainId: 137,
    verifyingContract: "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E",
  };

  const types = {
    Order: [
      { name: "salt", type: "uint256" },
      { name: "maker", type: "address" },
      { name: "signer", type: "address" },
      { name: "taker", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "makerAmount", type: "uint256" },
      { name: "takerAmount", type: "uint256" },
      { name: "expiration", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "feeRateBps", type: "uint256" },
      { name: "side", type: "uint8" },
      { name: "signatureType", type: "uint8" },
    ],
  };

  const signature = await signer._signTypedData(domain, types, {
    ...order,
    side: side === "BUY" ? 0 : 1,
    feeRateBps: 0,
    signatureType: 0,
  });

  return {
    ...order,
    side,
    signature,
  };
}

// ---------------- API Handler ----------------
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { wallet, marketId, fullCashout = true, size } = req.body;
    if (!wallet || !marketId) return res.status(400).json({ error: "Missing wallet or marketId" });

    const privateKey = process.env.WALLET_PRIVATE_KEY;
    if (!privateKey) throw new Error("Missing WALLET_PRIVATE_KEY");
    const signer = new Wallet(privateKey);
    const signingAddress = await signer.getAddress();

    
    const apiKeyData = await getApiKey(signer, signingAddress);

    
    const position = await fetchPositionFromRedis(wallet, marketId);
    if (!position) return res.status(404).json({ error: "Position not found" });

    const cashoutSize = fullCashout ? position.size : size || position.size;

    // Get live market price
    const bestPrice = await getBestMarketPrice(apiKeyData, signingAddress, position.tokenID);

    // Return live price data instead of trying to place order
    return res.status(200).json({
      success: true,
      message: "Live market data retrieved successfully",
      position: {
        marketId: position.marketId,
        outcome: position.outcome,
        size: cashoutSize,
        tokenID: position.tokenID,
      },
      liveMarketData: {
        currentBestBid: bestPrice,
        recommendedSellPrice: bestPrice * 0.99,
        estimatedCashoutValue: cashoutSize * bestPrice * 0.99,
        timestamp: new Date().toISOString()
      },
      instructions: "Use CLOB TypeScript client to execute the actual sell order"
    });

  } catch (err: any) {
    return res.status(500).json({ 
      error: "Failed to get market data", 
      details: err.message 
    });
  }
}