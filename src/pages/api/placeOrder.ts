import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import axios from "axios";

const CLOB_API = "https://clob.polymarket.com";
const JWT_SECRET = process.env.JWT_SECRET!;

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

    if (!wallet) {
      return res.status(401).json({ error: "Invalid token - no wallet" });
    }

    const { marketId, outcome, size, price } = req.body;
    if (!marketId || !outcome || !size || !price) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Submit to Polymarket CLOB API
    const orderPayload = {
      marketId,
      outcome,
      size,
      price,
      wallet,
    };

    // const clobRes = await axios.post(`${CLOB_API}/orders`, orderPayload);

    return res.json({ success: true, order: orderPayload });
  } catch (err: any) {
    console.error("PlaceOrder error:", err);
    return res.status(500).json({ error: "Failed to place order" });
  }
}
