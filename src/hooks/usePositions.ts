import { useEffect, useState } from "react";

export function usePositions(wallet: string | null) {
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wallet) return;

    async function fetchPositions() {
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
    }

    fetchPositions();
  }, [wallet]);

  return { positions, loading, error };
}
