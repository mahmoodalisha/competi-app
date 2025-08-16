import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const GAMMA_API = "https://gamma-api.polymarket.com";
const CLOB_API = "https://clob.polymarket.com";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Market ID required" });
  }

  try {
    
    const { data: metadata } = await axios.get(`${GAMMA_API}/markets/${id}`);

    if (!metadata) {
      return res.status(404).json({ error: "Market not found" });
    }

    
    const { data: orderbook } = await axios.get(`${CLOB_API}/markets/${id}/orderbook`);

    
    let outcomes: string[] = [];
    try {
      outcomes =
        typeof metadata.outcomes === "string"
          ? JSON.parse(metadata.outcomes)
          : metadata.outcomes || [];
    } catch {
      outcomes = [];
    }

    
    const odds: number[] = [];
    const probabilities: number[] = [];

    outcomes.forEach((_o, idx) => {
      const bestBid = parseFloat(orderbook.buys?.[idx]?.price || "0");
      const bestAsk = parseFloat(orderbook.sells?.[idx]?.price || "0");
      const mid = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : 0;
      odds.push(mid);
    });

    const sum = odds.reduce((a, b) => a + b, 0) || 1;
    outcomes.forEach((_o, idx) => probabilities.push(odds[idx] / sum));

    
    res.status(200).json({
      id: metadata.id,
      question: metadata.question,
      slug: metadata.slug,
      description: metadata.description,
      image: metadata.image,
      active: metadata.active,
      outcomes,
      odds,
      probabilities,
      orderbook,
    });
  } catch (err: any) {
    console.error("Market API error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch market data" });
  }
}
