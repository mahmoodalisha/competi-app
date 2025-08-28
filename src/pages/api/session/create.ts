// src/pages/api/session/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { discordUserId, wallet, marketId, type } = req.body;

  if (!discordUserId || !wallet) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Generate a short-lived JWT
  const token = jwt.sign({ discordUserId, wallet }, JWT_SECRET, { expiresIn: "5m" });

  let url = "";
  if (type === "placebet") {
    if (!marketId) return res.status(400).json({ error: "marketId is required for placebet" });
    url = `http://localhost:3000/market/${marketId}?token=${token}`;
  } else if (type === "cashout") {
    url = `http://localhost:3000/cashout?token=${token}`;
  } else {
    return res.status(400).json({ error: "Invalid session type" });
  }

  res.json({ url, token });
}
