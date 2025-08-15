import { useState, useEffect } from "react";
import axios from "axios";

export interface Market {
  id: string;
  question: string;
  outcomes: string[];
  status: "open" | "closed";
  [key: string]: any;
}

export const useMarketData = (marketId: string) => {
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMarket = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/markets/${marketId}`);
      setMarket(data);
    } catch (err) {
      console.error(err);
      setMarket(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (marketId) fetchMarket();
  }, [marketId]);

  return { market, loading, refresh: fetchMarket };
};
