import { useState, useEffect } from "react";
import axios from "axios";

export interface Market {
  id: string;
  question: string;
  outcomes: string[];
  orderbook: any;
  odds: number[];
  probabilities: number[];
}

export const useMarketData = (marketId: string) => {
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMarket = async () => {
    if (!marketId) return;
    setLoading(true);

    try {
      const { data } = await axios.get(`/api/markets/${marketId}`);
      setMarket(data);
    } catch (err) {
      console.error("Error fetching market:", err);
      setMarket(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchMarket();
    const interval = setInterval(fetchMarket, 10000);
    return () => clearInterval(interval);
  }, [marketId]);

  return { market, loading, refresh: fetchMarket };
};
