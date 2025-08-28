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
    const metadataResponse = await axios.get(`${GAMMA_API}/markets/${id}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PolymarketBot/1.0)',
        'Accept': 'application/json',
      }
    });
    
    const metadata = metadataResponse.data;

    if (!metadata) {
      return res.status(404).json({ error: "Market not found" });
    }

    const tokens = metadata.tokens || [];
    let orderbook: any = { buys: [], sells: [] };
    
    if (tokens.length > 0) {
      try {
        const tokenId = tokens[0].token_id;
        if (tokenId) {
          const orderbookResponse = await axios.get(`${CLOB_API}/book`, {
            params: { token_id: tokenId },
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; PolymarketBot/1.0)',
              'Accept': 'application/json',
            }
          });
          
          orderbook = orderbookResponse.data;
        }
      } catch (orderbookError) {
      }
    }

    
    let outcomes: string[] = [];
    try {
      if (typeof metadata.outcomes === "string") {
        outcomes = JSON.parse(metadata.outcomes);
      } else if (Array.isArray(metadata.outcomes)) {
        outcomes = metadata.outcomes;
      } else {
        outcomes = [];
      }
    } catch (parseError) {
      outcomes = [];
    }

    const odds: number[] = [];
    const probabilities: number[] = [];

    if (tokens.length > 0) {
      tokens.forEach((token: any, idx: number) => {
        try {
          const bestBid = parseFloat(orderbook.bids?.[0]?.price || "0");
          const bestAsk = parseFloat(orderbook.asks?.[0]?.price || "0");
          let mid = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : 0;
          
          if (!mid && token.price) {
            mid = parseFloat(token.price);
          }
          
          odds.push(mid);
        } catch (oddError) {
          odds.push(0);
        }
      });
    } else {
      outcomes.forEach((_outcome, idx) => {
        odds.push(0.5);
      });
    }

    const sum = odds.reduce((a, b) => a + b, 0) || 1;
    outcomes.forEach((_outcome, idx) => {
      probabilities.push(odds[idx] / sum);
    });

    
    const response = {
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
    };

    res.status(200).json(response);
    
  } catch (err: any) {
    console.error("Market API error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch market data" });
  }
}