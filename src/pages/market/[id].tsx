//pages/market/[id].tsx
import { useEffect, useState } from "react";
import { useMarketData } from "../../hooks/useMarketData";
import { usePlaceOrder } from "../../hooks/usePlaceOrder";
import PriceChart from "../../components/PriceChart";

function Loader() {
  return (
    <div className="flex justify-center items-center p-4">
      <p>Loading...</p>
    </div>
  );
}

export default function MarketPage() {
  const [token, setToken] = useState<string>("");
  const [marketId, setMarketId] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);

  const { market, loading } = useMarketData(marketId);
  const { placeOrder, placing } = usePlaceOrder(token);

  useEffect(() => {
    const urlToken = new URLSearchParams(window.location.search).get("token");
    if (urlToken) setToken(urlToken);

    const id = window.location.pathname.split("/").pop();
    if (id) setMarketId(id);
  }, []);

  if (loading || !marketId) return <Loader />;
  if (!market) return <p>Market not found</p>;

  // Parse outcomes array safely
  let outcomes: string[] = [];
  try {
    outcomes =
      typeof market.outcomes === "string"
        ? JSON.parse(market.outcomes)
        : market.outcomes || [];
  } catch {
    outcomes = [];
  }

  const adjustAmount = (delta: number) => {
    setAmount((prev) => Math.max(0, prev + delta));
  };

  const quickSet = (val: number) => {
    setAmount(val);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {market.question}
      </h1>

      <PriceChart marketId={marketId} />

      <div className="rounded-2xl p-6 shadow-lg bg-gray-900 mt-8">
        <h2 className="text-xl font-semibold mb-4">Choose Outcome</h2>

        {/* Outcome selector */}
        <div className="flex gap-4 mb-6">
          {outcomes.map((o) => (
            <button
              key={o}
              onClick={() => setSelectedOutcome(o)}
              className={`px-6 py-2 rounded-xl font-medium transition ${
                selectedOutcome === o
                  ? "bg-purple-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {o}
            </button>
          ))}
        </div>

        {/* Show odds + probability for selected outcome */}
        <div className="flex justify-between mb-6">
          <p>
            Odds{" "}
            <span className="font-bold">
              {selectedOutcome
                ? market.odds?.[outcomes.indexOf(selectedOutcome)] ?? "N/A"
                : "N/A"}
            </span>
          </p>
          <p>
            Probability{" "}
            <span className="font-bold">
              {selectedOutcome
                ? market.probabilities?.[outcomes.indexOf(selectedOutcome)]
                  ? `${(
                      market.probabilities[outcomes.indexOf(selectedOutcome)] *
                      100
                    ).toFixed(1)}%`
                  : "N/A"
                : "N/A"}
            </span>
          </p>
        </div>

        {/* Bet controls */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={() => adjustAmount(-10)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-600 text-white text-xl"
          >
            –
          </button>
          <div className="text-3xl font-bold">${amount}</div>
          <button
            onClick={() => adjustAmount(10)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-600 text-white text-xl"
          >
            +
          </button>
        </div>

        {/* Quick set buttons */}
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {[1, 10, 50, 1000].map((val) => (
            <button
              key={val}
              onClick={() => quickSet(val)}
              className="px-3 py-1 bg-gray-700 rounded-lg hover:bg-gray-600"
            >
              ${val}
            </button>
          ))}
          <button
            onClick={() => quickSet(5000)}
            className="px-3 py-1 bg-gray-700 rounded-lg hover:bg-gray-600"
          >
            Max
          </button>
        </div>

        {/* Review button */}
        <button
          onClick={() => {
            if (selectedOutcome && amount > 0) {
              placeOrder(marketId, selectedOutcome, amount);
            }
          }}
          disabled={placing || !selectedOutcome || amount === 0}
          className="w-full py-3 bg-purple-600 rounded-xl text-white font-semibold text-lg hover:bg-purple-700 disabled:opacity-50"
        >
          Review trade
        </button>
      </div>
    </div>
  );
}
