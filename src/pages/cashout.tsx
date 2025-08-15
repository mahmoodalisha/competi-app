import { useEffect, useState } from "react";
import { usePositions } from "../hooks/usePositions";
import { useCashout } from "../hooks/useCashout";

interface Position {
  positionId: string;
  marketId: string;
  outcome: string;
  size: number;
  odds: number;
  status: "open" | "closed";
}


function Loader() {
  return (
    <div className="flex justify-center items-center p-4">
      <p>Loading...</p>
    </div>
  );
}


interface PositionCardProps {
  position: Position;
  onCashout?: () => void;
  loading?: boolean;
}

function PositionCard({ position, onCashout, loading }: PositionCardProps) {
  return (
    <div className="border p-4 rounded mb-2 shadow">
      <p>Market: {position.marketId}</p>
      <p>Outcome: {position.outcome}</p>
      <p>Size: {position.size}</p>
      <p>Odds: {position.odds}</p>
      <p>Status: {position.status}</p>
      {onCashout && (
        <button
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded"
          onClick={onCashout}
          disabled={loading}
        >
          {loading ? "Cashouting..." : "Cashout"}
        </button>
      )}
    </div>
  );
}

export default function CashoutPage() {
  const [token, setToken] = useState<string>("");
  const { positions, loading, refresh } = usePositions(token);
  const { cashoutPosition, cashoutLoading } = useCashout(token);

  useEffect(() => {
    const urlToken = new URLSearchParams(window.location.search).get("token");
    if (urlToken) setToken(urlToken);
  }, []);

  if (!token) return <p>Missing session token.</p>;
  if (loading) return <Loader />;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Your Open Positions</h1>
      <div className="grid gap-4">
        {positions.length === 0 && <p>No open positions</p>}
        {positions.map((pos) => (
          <PositionCard
            key={pos.positionId}
            position={pos}
            onCashout={async () => {
              await cashoutPosition(pos.positionId, pos.size);
              refresh(); // refresh positions after cashout
            }}
            loading={cashoutLoading}
          />
        ))}
      </div>
    </div>
  );
}