//src/hooks/usePositions.ts
import { useEffect, useState, useCallback } from "react";

export function usePositions(wallet: string | null) {
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  
  const fetchPositions = useCallback(async () => {
    if (!wallet) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/positions?wallet=${wallet}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPositions(data.positions);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  
  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  
  return { positions, loading, error, refetch: fetchPositions };
}
