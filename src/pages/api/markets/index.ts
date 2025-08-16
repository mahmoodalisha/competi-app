import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const GAMMA_API = "https://gamma-api.polymarket.com";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { data } = await axios.get(
      `${GAMMA_API}/markets?limit=200&offset=0&active=true&closed=false`
    );
    const marketsArray = Array.isArray(data) ? data : data.data;
    const markets = marketsArray.map((m: any) => ({
      id: m.id,
      question: m.question,
      slug: m.slug,
      active: m.active,
      volume: m.volume,
    }));

    res.status(200).json(markets);
  } catch (err: any) {
    console.error("Markets API error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch markets" });
  }
}
