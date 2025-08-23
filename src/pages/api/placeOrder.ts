import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import axios from "axios";
import redis from "@/lib/redis";

const CLOB_API = "https://clob.polymarket.com";
const JWT_SECRET = process.env.JWT_SECRET!;

async function getTokenIdFromMarket(marketId: string, outcome: string): Promise<string> {
  console.log("🔍 Searching for marketId:", marketId, "outcome:", outcome);
  
  const marketsRes = await axios.get(`https://gamma-api.polymarket.com/markets?id=${marketId}`);
  console.log("📊 Gamma Markets API response:", marketsRes.data);
  
  if (!marketsRes.data || marketsRes.data.length === 0) {
    throw new Error(`Market not found for ID: ${marketId}`);
  }
  
  const market = marketsRes.data[0];
  
  
  const conditionId = market.conditionId;
  console.log("✅ Found conditionId:", conditionId);
  
  
  const clobTokenIds = JSON.parse(market.clobTokenIds);
  console.log("🎯 CLOB Token IDs:", clobTokenIds);
  
  const tokenIndex = outcome === "YES" ? 0 : 1;
  const tokenId = clobTokenIds[tokenIndex];
  
  console.log(`📍 Token ID for ${outcome}:`, tokenId);
  return tokenId;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { wallet: string; discordUserId: string };
    const wallet = decoded.wallet;
    if (!wallet) return res.status(401).json({ error: "Invalid token - no wallet" });

    
    const { marketId, outcome, size, price } = req.body;
    if (!marketId || !outcome || !size || !price) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const tokenID = await getTokenIdFromMarket(marketId, outcome);

    const orderPayload = {
      marketId,
      outcome,
      size,
      price,
      tokenID,
      wallet,
      timestamp: Date.now(),
    };

    const key = `orders:${wallet}`;
    await redis.rpush(key, JSON.stringify(orderPayload));

    return res.status(200).json({ success: true, order: orderPayload });
  } catch (err: any) {
    console.error("PlaceOrder error:", err);
    return res.status(500).json({ error: "Failed to place order", details: err.message });
  }
}
