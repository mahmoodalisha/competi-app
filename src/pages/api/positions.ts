import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { Wallet } from "ethers";
import crypto from "crypto";
import redis from "@/lib/redis"; 

const MSG_TO_SIGN = "This message attests that I control the given wallet";
type Chain = number;
const CLOB_API = process.env.NEXT_PUBLIC_CLOB_API_URL || "https://clob.polymarket.com";

async function buildClobEip712Signature(signer: Wallet, chainId: Chain, timestamp: string, nonce: number): Promise<string> {
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

function generateL2HmacSignature(secret: string, timestamp: string, method: string, path: string) {
  const msg = timestamp + method.toUpperCase() + path;
  return crypto.createHmac("sha256", secret).update(msg).digest("hex");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const wallet = req.query.wallet as string;
    if (!wallet) return res.status(400).json({ error: "Missing wallet query" });

    
    const redisKey = `orders:${wallet}`;
    const rawOrders = await redis.lrange(redisKey, 0, -1);
    const cachedOrders = rawOrders.map(o => JSON.parse(o));
    
    const forceRefresh = req.query.refresh === 'true';
    // If we have orders in Redis, return them immediately
    if (cachedOrders.length > 0 && !forceRefresh) {
      return res.status(200).json({
        success: true,
        wallet,
        positions: cachedOrders,
        openOrders: cachedOrders,
        source: "redis"
      });
    }

    // =========================
    // Otherwise, fetch real positions/orders from Polymarket
    // =========================

    const privateKey = process.env.WALLET_PRIVATE_KEY;
    if (!privateKey) throw new Error("Missing WALLET_PRIVATE_KEY in .env.local");

    const signer = new Wallet(privateKey);
    const signingAddress = await signer.getAddress();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = 0;
    const chainId: Chain = 137;

    const signature = await buildClobEip712Signature(signer, chainId, timestamp, nonce);

    let apiKeyData: { apiKey: string; secret: string; passphrase: string } | null = null;
    try {
      const deriveRes = await axios.get(`${CLOB_API}/auth/derive-api-key`, {
        headers: {
          POLY_ADDRESS: signingAddress,
          POLY_SIGNATURE: signature,
          POLY_TIMESTAMP: timestamp,
          POLY_NONCE: nonce,
        },
      });
      apiKeyData = deriveRes.data;
    } catch {
      const createRes = await axios.post(`${CLOB_API}/auth/api-key`, {}, {
        headers: {
          POLY_ADDRESS: signingAddress,
          POLY_SIGNATURE: signature,
          POLY_TIMESTAMP: timestamp,
          POLY_NONCE: nonce,
        },
      });
      apiKeyData = createRes.data;
    }
    if (!apiKeyData) throw new Error("Failed to obtain API key");

    const { apiKey, secret: apiSecret, passphrase: apiPassphrase } = apiKeyData;

    const proxyWalletRes = await axios.get(`${CLOB_API}/data/proxy-wallet`, {
      headers: {
        POLY_ADDRESS: signingAddress,
        POLY_API_KEY: apiKey,
        POLY_PASSPHRASE: apiPassphrase,
        POLY_TIMESTAMP: timestamp,
        POLY_SIGNATURE: generateL2HmacSignature(apiSecret, timestamp, "GET", "/data/proxy-wallet"),
      },
    });
    const proxyWallet = proxyWalletRes.data.proxyWallet || wallet;

    const positionsPath = `/data/positions/${proxyWallet}`;
    const ordersPath = `/data/orders/${proxyWallet}`;
    const positionsUrl = `${CLOB_API}${positionsPath}`;
    const ordersUrl = `${CLOB_API}${ordersPath}`;
    const l2Timestamp = Math.floor(Date.now() / 1000).toString();

    const positionsSig = generateL2HmacSignature(apiSecret, l2Timestamp, "GET", positionsPath);
    const ordersSig = generateL2HmacSignature(apiSecret, l2Timestamp, "GET", ordersPath);

    const [positionsRes, ordersRes] = await Promise.all([
      axios.get(positionsUrl, {
        headers: {
          POLY_ADDRESS: signingAddress,
          POLY_API_KEY: apiKey,
          POLY_PASSPHRASE: apiPassphrase,
          POLY_TIMESTAMP: l2Timestamp,
          POLY_SIGNATURE: positionsSig,
        },
      }),
      axios.get(ordersUrl, {
        headers: {
          POLY_ADDRESS: signingAddress,
          POLY_API_KEY: apiKey,
          POLY_PASSPHRASE: apiPassphrase,
          POLY_TIMESTAMP: l2Timestamp,
          POLY_SIGNATURE: ordersSig,
        },
      }),
    ]);
    // Transform positions to include tokenID
    console.log("Raw positions response:", JSON.stringify(positionsRes.data, null, 2));
    console.log("Raw orders response:", JSON.stringify(ordersRes.data, null, 2));
  const positionsWithTokens = positionsRes.data.map((position: any) => ({
  marketId: position.market || position.condition_id || position.conditionId,
  outcome: position.outcome,
  size: position.size,
  price: position.price,
  tokenID: position.asset,
  wallet: proxyWallet,
  timestamp: Date.now()
}));


await redis.del(`orders:${wallet}`);
for (const position of positionsWithTokens) {
  await redis.lpush(`orders:${wallet}`, JSON.stringify(position));
}

    return res.status(200).json({
      success: true,
      wallet: proxyWallet,
      positions: positionsWithTokens,
      openOrders: ordersRes.data,
      source: "polymarket"
    });

  } catch (err: any) {
    console.error("Positions fetch error:", err.message, err.response?.data);
    return res.status(500).json({
      error: "Failed to fetch positions",
      details: err.response?.data || err.message || "Unknown error",
    });
  }
}