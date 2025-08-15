import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { verifySessionToken } from "@/lib/auth";

const CLOB_API = process.env.NEXT_PUBLIC_CLOB_API_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { token, tokenId, amount } = req.body;
  if (!token || !tokenId || !amount)
    return res.status(400).json({ error: "token, tokenId, and amount are required" });

  const session = await verifySessionToken(token);
  if (!session) return res.status(401).json({ error: "Invalid or expired token" });

  try {
    const orderBookRes = await axios.get(`${CLOB_API}/book/${tokenId}`);
    const livePrice = orderBookRes.data.asks[0]?.price; // BUY at lowest ask
    if (!livePrice) return res.status(400).json({ error: "No asks available" });

    const orderPayload = {
      tokenId,
      side: "BUY",
      size: amount,
      price: livePrice,
      address: session.walletAddress
    };

    const response = await axios.post(`${CLOB_API}/order`, orderPayload, {
      headers: { "Content-Type": "application/json" }
    });

    res.status(200).json(response.data);
  } catch (error: any) {
    console.error("Place order failed:", error.message);
    res.status(500).json({ error: "Failed to place order" });
  }
}
