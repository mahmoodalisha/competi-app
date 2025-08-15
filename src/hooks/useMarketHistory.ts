import { useState, useEffect } from "react";
import axios from "axios";

interface MarketHistoryPoint {
  timestamp: string;
  price: number; 
}

export function useMarketHistory(marketId: string | undefined) {
  const [history, setHistory] = useState<MarketHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!marketId) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_GAMMA_API_URL}/markets/${marketId}/trades?limit=100`
        );

        // Transform trades into chart points
        const chartData: MarketHistoryPoint[] = res.data.map((trade: any) => ({
          timestamp: trade.createdAt,
          price: trade.price, 
        }));

        setHistory(chartData.reverse()); // oldest → newest
      } catch (err) {
        console.error(err);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [marketId]);

  return { history, loading };
}
