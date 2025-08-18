import { useState, useEffect, useCallback } from "react";
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

  const fetchMarket = useCallback(async () => {
    if (!marketId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.get(`/api/markets/${marketId}`, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      setMarket(data);
    } catch (err) {
      console.error("Error fetching market:", err);
      setMarket(null);
    } finally {
      setLoading(false);
    }
  }, [marketId]);

  useEffect(() => {
    fetchMarket();
    
    // Only set up polling if we have a valid marketId
    if (!marketId) return;
    
    const interval = setInterval(fetchMarket, 10000);
    
    return () => clearInterval(interval);
  }, [fetchMarket]);

  const retry = useCallback(() => {
    fetchMarket();
  }, [fetchMarket]);

  return { 
    market, 
    loading, 
    refresh: fetchMarket,
    retry 
  };
};