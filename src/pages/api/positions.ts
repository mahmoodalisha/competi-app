import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { Wallet } from "ethers";
import crypto from "crypto";

const MSG_TO_SIGN = "This message attests that I control the given wallet";
type Chain = number;

const CLOB_API = process.env.NEXT_PUBLIC_CLOB_API_URL || "https://clob.polymarket.com";

//EIP-712 signature
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

//L2 HMAC signature
function generateL2HmacSignature(secret: string, timestamp: string, method: string, path: string) {
  const msg = timestamp + method.toUpperCase() + path;
  return crypto.createHmac("sha256", secret).update(msg).digest("hex");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const privateKey = process.env.WALLET_PRIVATE_KEY;
    if (!privateKey) throw new Error("Missing WALLET_PRIVATE_KEY in .env.local");

    const signer = new Wallet(privateKey);
    const signingAddress = await signer.getAddress();
    const wallet = (req.query.wallet as string) || signingAddress;

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = 0;
    const chainId: Chain = 137;
    const signature = await buildClobEip712Signature(signer, chainId, timestamp, nonce);

    //Create API Key
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

    const { apiKey, secret: apiSecret, passphrase: apiPassphrase } = apiKeyData; // ✅ safe now

    
    const positionsPath = "/data/positions";
    const ordersPath = "/data/orders";
    const l2Timestamp = Math.floor(Date.now() / 1000).toString();

    const positionsSig = generateL2HmacSignature(apiSecret, l2Timestamp, "GET", positionsPath);
    const ordersSig = generateL2HmacSignature(apiSecret, l2Timestamp, "GET", ordersPath);

    const [positionsRes, ordersRes] = await Promise.all([
      axios.get(`${CLOB_API}${positionsPath}`, {
        headers: {
          POLY_ADDRESS: signingAddress,
          POLY_API_KEY: apiKey,
          POLY_PASSPHRASE: apiPassphrase,
          POLY_TIMESTAMP: l2Timestamp,
          POLY_SIGNATURE: positionsSig,
        },
        params: { user: wallet },
      }),
      axios.get(`${CLOB_API}${ordersPath}`, {
        headers: {
          POLY_ADDRESS: signingAddress,
          POLY_API_KEY: apiKey,
          POLY_PASSPHRASE: apiPassphrase,
          POLY_TIMESTAMP: l2Timestamp,
          POLY_SIGNATURE: ordersSig,
        },
        params: { user: wallet },
      }),
    ]);

    return res.status(200).json({
      success: true,
      wallet,
      positions: positionsRes.data,
      openOrders: ordersRes.data,
    });
  } catch (err: any) {
    console.error("Positions fetch error:", err.message, err.response?.data);
    return res.status(500).json({
      error: "Failed to fetch positions",
      details: err.response?.data || err.message || "Unknown error",
    });
  }
}
