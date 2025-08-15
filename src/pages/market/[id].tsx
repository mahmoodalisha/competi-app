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

  const { market, loading } = useMarketData(marketId);
  const { placeOrder, placing } = usePlaceOrder(token);

  useEffect(() => {
    // Get token from query params
    const urlToken = new URLSearchParams(window.location.search).get("token");
    if (urlToken) setToken(urlToken);

    // Get marketId from URL path
    const id = window.location.pathname.split("/").pop();
    if (id) setMarketId(id);
  }, []);

  if (loading || !marketId) return <Loader />;
  if (!market) return <p>Market not found</p>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold">{market.question}</h1>
      <PriceChart marketId={marketId} /> 
      <div className="mt-4 flex gap-2">
        {market.outcomes.map((o: string) => (
          <button
            key={o}
            className="bg-purple-600 text-white px-4 py-2 rounded"
            onClick={() => placeOrder(marketId, o, 10)}
            disabled={placing}
          >
            Bet $10 on {o}
          </button>
        ))}
      </div>
    </div>
  );
}
