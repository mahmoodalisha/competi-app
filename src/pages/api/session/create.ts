import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { Wallet } from "ethers";
import Redis from "ioredis";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const redisUrl = process.env.REDIS_URL!;
const redis = new Redis(redisUrl);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { discordId } = req.body;
  if (!discordId) return res.status(400).json({ error: "discordId is required" });

  
  let walletAddress = await redis.get(`wallet:${discordId}`);
  if (!walletAddress) {
    // Generate new wallet
    const wallet = Wallet.createRandom();
    walletAddress = wallet.address;

    await redis.set(`wallet:${discordId}`, walletAddress);
    console.log(`Generated wallet for Discord ID ${discordId}: ${walletAddress}`);
  }


  const token = jwt.sign({ discordId, walletAddress }, JWT_SECRET, { expiresIn: "10m" });

  
  await redis.set(`session:${token}`, discordId, "EX", 600); 

  res.status(200).json({
    url: `http://localhost:3000/cashout?token=${token}`,
    token
  });
}
