import { useState, useCallback } from "react";
import axios from "axios";

export function usePlaceOrder(token: string) {
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeOrder = useCallback(
    async (marketId: string, outcome: string, size: number, price?: number) => {
      try {
        setPlacing(true);
        setError(null);

        
        const res = await axios.post(
          "/api/placeOrder",
          { marketId, outcome, size, price: price ?? 0.5 }, 
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        return res.data;
      } catch (err: any) {
        console.error("Place order failed:", err);
        setError(err.response?.data?.error || "Failed to place order");
        throw err;
      } finally {
        setPlacing(false);
      }
    },
    [token]
  );

  return { placeOrder, placing, error };
}
