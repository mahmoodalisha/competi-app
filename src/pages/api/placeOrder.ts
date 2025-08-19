// src/pages/api/placeOrder.ts
import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import axios from "axios";

const CLOB_API = "https://clob.polymarket.com";
const JWT_SECRET = process.env.JWT_SECRET!; // same secret you used in session/create.ts

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ✅ 1. Extract JWT from headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }
    const token = authHeader.split(" ")[1];

    // ✅ 2. Verify token & extract wallet
    const decoded = jwt.verify(token, JWT_SECRET) as { wallet: string; discordUserId: string };
    const wallet = decoded.wallet;

    if (!wallet) {
      return res.status(401).json({ error: "Invalid token - no wallet" });
    }

    // ✅ 3. Extract order params from body
    const { marketId, outcome, size, price } = req.body;
    if (!marketId || !outcome || !size || !price) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ 4. Submit to Polymarket CLOB API
    // (Here you will eventually sign with wallet, but for now mock or forward)
    const orderPayload = {
      marketId,
      outcome,
      size,
      price,
      wallet, // comes from token, not body!
    };

    // Example: skip real signing for now, just echo order
    // const clobRes = await axios.post(`${CLOB_API}/orders`, orderPayload);

    return res.json({ success: true, order: orderPayload });
  } catch (err: any) {
    console.error("PlaceOrder error:", err);
    return res.status(500).json({ error: "Failed to place order" });
  }
}
