import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const GAMMA_API = process.env.NEXT_PUBLIC_GAMMA_API_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Market ID is required" });

  try {
    const response = await axios.get(`${GAMMA_API}/markets/${id}`);
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error(`Error fetching market ${id}:`, error.message);
    res.status(500).json({ error: "Failed to fetch market details" });
  }
}
