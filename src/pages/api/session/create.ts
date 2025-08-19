import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { discordUserId, wallet, marketId } = req.body;

  if (!discordUserId || !wallet || !marketId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  
  const token = jwt.sign({ discordUserId, wallet }, JWT_SECRET, { expiresIn: "5m" });

  const url = `http://localhost:3000/market/${marketId}?token=${token}`;
  res.json({ url, token });
}
