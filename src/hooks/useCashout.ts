import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

export interface Position {
  marketId: string;
  outcome: string;
  size: number;
  price: number;
  tokenID: string;
  wallet: string;
  timestamp: number;
}

interface TokenPayload {
  wallet: string;
}

export function useCashout(token: string) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  
  let wallet: string | null = null;
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    wallet = decoded.wallet;
  } catch {
    wallet = null;
  }

  const fetchPositions = useCallback(async () => {
    if (!wallet) {
      setError("Invalid wallet from session token");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(`/api/positions`, {
        params: { wallet }, // pass wallet address
      });

      setPositions(res.data.positions || []);
    } catch (err: any) {
      console.error("Failed to fetch positions:", err);
      setError(err.response?.data?.error || "Failed to fetch positions");
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  const submitCashout = useCallback(
    async (position: Position, size?: number) => {
      if (!wallet) throw new Error("Invalid wallet");

      try {
        const res = await axios.post(`/api/cashout`, {
          wallet: position.wallet,
          marketId: position.marketId,
          size,
          fullCashout: !size,
        });

        setPositions((prev: Position[]) =>
          prev
            .map((p) =>
              p.tokenID === position.tokenID
                ? { ...p, size: p.size - (size || p.size) }
                : p
            )
            .filter((p) => p.size > 0)
        );

        return res.data;
      } catch (err: any) {
        console.error("Cashout failed:", err);
        throw err;
      }
    },
    [wallet]
  );

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  return { positions, loading, error, fetchPositions, submitCashout };
}
