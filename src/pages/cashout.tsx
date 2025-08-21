import { usePositions } from "../hooks/usePositions";

export default function CashoutPage() {
  const wallet = "0x67849Fb8d4a62C87D9C426E32102f9f63885d482"; // later: resolve via Discord or session
  const { positions, loading, error } = usePositions(wallet);

  if (loading) return <p>Loading positions...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Your Open Positions</h1>
      {positions.length === 0 ? (
        <p>No open positions</p>
      ) : (
        <ul className="space-y-4">
          {positions.map((pos: any, idx: number) => (
            <li key={idx} className="p-4 border rounded-lg shadow">
              <p>Market: {pos.market}</p>
              <p>Outcome: {pos.outcome}</p>
              <p>Amount: {pos.amount}</p>
              <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
                Cashout
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
