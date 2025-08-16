import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";

interface Market {
  id: string;
  question: string;
  slug: string;
  active: boolean;
  volume: number;
}

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const res = await axios.get("/api/markets");
        setMarkets(res.data);
      } catch (err) {
        console.error("Error fetching markets:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMarkets();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-gray-300">
        <p>Loading markets...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 px-6 py-10">
      <h1 className="text-3xl font-extrabold mb-10 text-center bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
        Explore Markets
      </h1>

      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {markets.map((market) => (
          <Link
            key={market.id}
            href={`/market/${market.id}`}
            className="group block bg-gray-900 rounded-2xl p-6 shadow-md hover:shadow-xl border border-gray-800 hover:border-indigo-500 transition transform hover:-translate-y-1"
          >
            <h2 className="text-lg font-semibold mb-3 group-hover:text-indigo-400 transition">
              {market.question}
            </h2>
            <p className="text-sm text-gray-500 mb-4">{market.slug}</p>
            <div className="flex justify-between items-center">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  market.active
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {market.active ? "Active" : "Closed"}
              </span>
              <span className="text-sm font-semibold text-indigo-400">
                Volume: {market.volume?.toLocaleString() || "N/A"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
