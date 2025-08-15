import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { verifySessionToken } from "@/lib/auth";

const DATA_API = process.env.NEXT_PUBLIC_DATA_API_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.query.token as string;
    if (!token) return res.status(400).json({ error: "Token is required" });

    
    const session = await verifySessionToken(token);
    if (!session) return res.status(401).json({ error: "Invalid or expired token" });

    
    const response = await axios.get(`${DATA_API}/positions`, {
      params: { user: session.walletAddress }
    });

    res.status(200).json(response.data);
  } catch (error: any) {
    console.error("Error fetching positions:", error.message);
    res.status(500).json({ error: "Failed to fetch positions" });
  }
}
