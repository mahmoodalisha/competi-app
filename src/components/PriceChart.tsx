import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PricePoint {
  time: string;
  price: number;
}

interface PriceChartProps {
  marketId: string;
}

export default function PriceChart({ marketId }: PriceChartProps) {
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!marketId) return;
    setLoading(true);

    const fetchMarketHistory = async () => {
      try {
        const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";
        const url = useMock
          ? `/api/mockMarket/${marketId}` // mock historical data
          : `${process.env.NEXT_PUBLIC_DATA_API_URL}/markets/${marketId}/trades?limit=100`;

        const res = await axios.get(url);

        let formatted: PricePoint[] = [];

        if (useMock) {
          // Mock: generate fake price points
          formatted = Array.from({ length: 20 }, (_, i) => ({
            time: `T-${20 - i}m`,
            price: 0.4 + Math.random() * 0.2,
          }));
        } else {
          // Polymarket API: map to {time, price}
          formatted = res.data.map((trade: any) => ({
            time: new Date(trade.createdAt).toLocaleTimeString(),
            price: trade.price,
          }));
        }

        setData(formatted);
      } catch (err) {
        console.error(err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketHistory();
  }, [marketId]);

  if (loading) return <p>Loading chart...</p>;
  if (!data.length) return <p>No price data available.</p>;

  return (
    <div className="border p-4 rounded shadow my-4">
      <h2 className="font-bold mb-2">Market Price History</h2>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <XAxis dataKey="time" />
          <YAxis domain={[0, 1]} />
          <Tooltip />
          <Line type="monotone" dataKey="price" stroke="#7c3aed" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
