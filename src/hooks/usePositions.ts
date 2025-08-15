import { useState, useEffect } from "react";
import axios from "axios";

export interface Position {
  positionId: string;
  marketId: string;
  outcome: string;
  size: number;       
  odds: number;
  status: "open" | "closed";
}


const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export const usePositions = (token: string) => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPositions = async () => {
    if (!token) return;
    setLoading(true);

    try {
      let data;
      if (USE_MOCK) {
        const res = await axios.get("/api/mockPositions");
        data = res.data;
      } else {
        const res = await axios.get(`/api/positions?token=${token}`);
        data = res.data.map((p: any) => ({
          positionId: p.id,
          marketId: p.marketId,
          outcome: p.outcome,
          size: p.amount,
          odds: p.odds,
          status: p.status,
        }));
      }

      setPositions(data);
    } catch (err) {
      console.error(err);
      setPositions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, [token]);

  return { positions, loading, refresh: fetchPositions };
};
