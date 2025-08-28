import { useEffect, useState } from "react";
import { RelatedMarketsSection } from "../../components/RelatedMarketsSection";
import { useMarketData } from "../../hooks/useMarketData";
import { usePlaceOrder } from "../../hooks/usePlaceOrder";
import { useMarketHistory } from "../../hooks/useMarketHistory";
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip } from "chart.js";
import { Line } from "react-chartjs-2";

 
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

function Loader() {
  return (
    <div className="flex justify-center items-center p-4 text-white">
      <p>Loading...</p>
    </div>
  );
}


function PriceChart({ marketId, range }: { marketId: string, range: string }) {
  const { history, loading } = useMarketHistory(marketId, range);
  let labels: string[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  let data: number[] = [37, 39, 45, 42, 30, 28, 26];
  if (history && Array.isArray(history.points) && history.points.length > 0) {
    labels = history.points.map((pt: any) => pt.label || pt.time || "");
    data = history.points.map((pt: any) => pt.value ?? pt.probability ?? 0);
  }
  const chartData = {
    labels,
    datasets: [
      {
        label: "Win Probability",
        borderColor: "#4ade80",
        borderWidth: 2,
        backgroundColor: (ctx: any) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, "rgba(74, 222, 128, 0.3)");
          gradient.addColorStop(1, "rgba(74, 222, 128, 0)");
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: (ctx: any) => (ctx.dataIndex === data.length - 1 ? 6 : 0),
        pointBackgroundColor: "#4ade80",
        pointBorderColor: "#1a1a1a",
        pointBorderWidth: 2,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: "#4ade80",
        pointHoverBorderColor: "rgba(74, 222, 128, 0.7)",
        pointHoverBorderWidth: 4,
        data,
      },
    ],
  };

  
  const options = {
    animation: {
      duration: 1000,
      easing: 'easeInOutQuad' as const,
    },
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 0,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        mode: "index" as const, 
        intersect: false, 
        backgroundColor: "#111",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context: any) => ` ${context.parsed.y}% chance`,
        },
      },
    },
    interaction: {
      mode: "index" as const, 
      intersect: false,
      axis: "x" as const,
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 0,
        max: 100,
        grid: { display: false },
        ticks: { display: false },
        border: { display: false },
      },
      x: {
        offset: false,
        grid: { display: false },
        ticks: {
          display: false, 
          color: "#999",
          font: { size: 12 },
          padding: 0,
        },
      },
    },
  };

  return (
    <div className="chart-container relative h-[200px] bg-transparent w-full">
      <div className="chart-overlay relative w-full h-full">
        <Line data={chartData} options={options} />
      </div>
      <div className="days flex justify-between mt-2 px-0">
        {labels.map((day, index) => (
          <div
            key={day}
            className={`day text-xs text-center flex-1 ${
              index === labels.length - 1 ? "current-day font-semibold text-blue-400" : "text-gray-400"
            }`}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MarketPage() {
  const [token, setToken] = useState<string>("");
  const [marketId, setMarketId] = useState<string>(""); 
  const [amount, setAmount] = useState<number>(0);
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<string>("7d");

  const { market, loading } = useMarketData(marketId);
  const { history } = useMarketHistory(marketId, selectedRange);
  const { placeOrder, placing } = usePlaceOrder(token);

  useEffect(() => {
    const urlToken = new URLSearchParams(window.location.search).get("token");
    if (urlToken) setToken(urlToken);

    const id = window.location.pathname.split("/").pop();
    if (id) setMarketId(id);
  }, []);

  if (loading || !marketId) return <Loader />;
  if (!market) return <p className="text-white text-center">Market not found</p>;
  let outcomes: string[] = [];
  let probabilities: number[] = [];
  try {
    outcomes =
      typeof market.outcomes === "string"
        ? JSON.parse(market.outcomes)
        : market.outcomes || [];
    probabilities =
      typeof market.probabilities === "string"
        ? JSON.parse(market.probabilities)
        : market.probabilities || [];
  } catch {
    outcomes = [];
    probabilities = [];
  }

  const getSelectedIndex = () => {
    if (!selectedOutcome || !outcomes.length) return 0;
    const idx = outcomes.findIndex(
      (o) => o.toLowerCase() === selectedOutcome.toLowerCase()
    );
    return idx === -1 ? 0 : idx;
  };
  const selectedIdx = getSelectedIndex();
  const outcomeLabel = outcomes[selectedIdx] || "";
  const odds = market?.odds?.[selectedIdx];
  const probability =
    probabilities[selectedIdx] !== undefined
      ? (probabilities[selectedIdx] * 100).toFixed(1)
      : ""; 

  const oddsDisplay =
    odds !== undefined && odds > 0 ? `+${Math.round(odds * 1000)}` : "";

  
  const getPriceChangeInfo = () => {
    if (!history) return { change: "+0.0", direction: "neutral", period: "7D" };
    
    const priceChange = history.priceChange || 0;
    const direction = history.changeDirection || (priceChange >= 0 ? "up" : "down");
    
    let periodLabel = "";
    switch (selectedRange) {
      case "7d":
        periodLabel = "7D";
        break;
      case "14d":
        periodLabel = "14D";
        break;
      case "30d":
        periodLabel = "1M";
        break;
      default:
        periodLabel = "7D";
    }

    const changeText = priceChange >= 0 ? `+${priceChange.toFixed(1)}` : `${priceChange.toFixed(1)}`;
    
    return { change: changeText, direction, period: periodLabel };
  };

  const priceChangeInfo = getPriceChangeInfo();

  const quickSet = (val: number) => {
    setAmount(val);
  };

  const adjustAmount = (delta: number) => {
    setAmount((prev) => Math.max(0, prev + delta));
  };

  return (
    <div className="content-wrapper max-w-[1100px] mx-auto p-4 min-h-screen flex flex-col bg-black gap-4">
      
      <div className="headline bg-[#1a1a1a] rounded-2xl shadow-lg p-5 flex items-center relative pl-16">
        <span
          className="absolute left-5 top-1/2 -translate-y-1/2"
          dangerouslySetInnerHTML={{
            __html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M23.0833 7.83333C23.0833 7.83333 19.5 2 16 2C12.5 2 8.91667 7.83333 8.91667 7.83333C8.91667 7.83333 2 11.3333 2 16C2 20.6667 8.91667 24.1667 8.91667 24.1667C8.91667 24.1667 12.5 30 16 30C19.5 30 23.0833 24.1667 23.0833 24.1667C23.0833 24.1667 30 20.6667 30 16C30 11.3333 23.0833 7.83333 23.0833 7.83333Z" fill="#9333ea"/><path d="M16 24C20.4183 24 24 20.4183 24 16C24 11.5817 20.4183 8 16 8C11.5817 8 8 11.5817 8 16C8 20.4183 11.5817 24 16 24Z" fill="#fff"/></svg>`,
          }}
        />
        <h1 className="text-xl font-semibold text-white flex-grow">
          {market.question}
        </h1>
        <div className="action-buttons flex gap-2">
          <button className="icon-button w-10 h-10 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center hover:bg-gray-600">
            <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </button>
          <button className="icon-button w-10 h-10 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center hover:bg-gray-600">
            <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      
      <div className="main-flex-row flex gap-4 flex-grow">
        <div className="main-col-left flex flex-col gap-4 flex-1">
          <div className="card-section overview bg-[#1a1a1a] rounded-2xl shadow-lg p-5 flex flex-col max-w-[740px]">
            <div className="overview-top-line flex justify-between items-center mb-4">
              <div className="overview-title text-lg font-semibold text-white">Overview</div>
              <div className="relative">
                <select
                  className="time-select bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 pr-8 text-sm cursor-pointer appearance-none"
                  value={selectedRange}
                  onChange={e => setSelectedRange(e.target.value)}
                >
                  <option value="7d">This week</option>
                  <option value="14d">Last 2 weeks</option>
                  <option value="30d">Last month</option>
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg width="16" height="16" fill="white" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="overview-details-section flex flex-col gap-1 mb-4">
              <div className="month text-sm font-medium text-gray-300">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
              <div className="probability-header text-2xl font-bold text-green-400 mb-1">
                {probabilities[0] !== undefined
                  ? `>${(probabilities[0] * 100).toFixed(0)}% chance`
                  : <span className="text-gray-500">No data</span>}
              </div>
            </div>
            <PriceChart marketId={marketId} range={selectedRange} />
            <div className={`change-info flex items-center justify-center mt-6 text-sm ${
              priceChangeInfo.direction === 'up' ? 'text-green-400' : 
              priceChangeInfo.direction === 'down' ? 'text-red-400' : 'text-gray-400'
            }`}>
              <svg
                className={`change-icon w-3.5 h-3.5 mr-1 ${
                  priceChangeInfo.direction === 'down' ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
              <span>{priceChangeInfo.change}% Change ({priceChangeInfo.period})</span>
            </div>
          </div>

          
          <div className="card-section bg-[#1a1a1a] rounded-2xl shadow-lg p-5 flex flex-col gap-4">
            <div className="section-header flex justify-between items-center">
              <h2 className="section-title text-lg font-semibold text-white">About</h2>
              <button className="icon-button w-10 h-10 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center hover:bg-gray-600">
                <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <p className="section-content text-sm text-gray-400 leading-relaxed">
              {market?.description || "No description available for this market."}
            </p>
          </div>

          
          <div className="card-section bg-[#1a1a1a] rounded-2xl shadow-lg p-5 flex flex-col gap-4">
            <h2 className="section-title text-lg font-semibold text-white">Recent Trades</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-300 border-b border-gray-700">Username</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-300 border-b border-gray-700">Price and Position</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-300 border-b border-gray-700">Time</th>
                  </tr>
                </thead>
                <tbody>
                  
                </tbody>
              </table>
            </div>
          </div>
        </div>

        
        <div className="main-col-right flex flex-col gap-4 w-[300px] flex-none">
          {/* Trade Section Card */}
          <div className="trade-section bg-[#1a1a1a] rounded-2xl shadow-lg p-5 flex flex-col gap-4">
            <div className="trade-probability flex justify-between text-sm font-semibold">
              <button
                className="trade-yes-prob bg-gray-700 text-gray-200 px-4 py-2 rounded-lg flex-1 text-center mr-2 transition hover:bg-green-600 hover:text-white focus:outline-none"
                onClick={() => setSelectedOutcome('Yes')}
                type="button"
              >
                Yes
              </button>
              <button
                className="trade-no-prob bg-gray-700 text-gray-200 px-4 py-2 rounded-lg flex-1 text-center transition hover:bg-red-600 hover:text-white focus:outline-none"
                onClick={() => setSelectedOutcome('No')}
                type="button"
              >
                No
              </button>
            </div>
            <div className="trade-odds bg-gray-800 rounded-lg p-4 flex flex-col gap-2">
              <div className="text-white">{outcomeLabel}</div>
              <div className="text-white">Odds {oddsDisplay} ({odds})</div>
              <div className="text-white">
                Probability {probability ? `${probability}%` : <span className="text-gray-400">No data</span>}
              </div>
              <div className="trade-odds-amount flex justify-between items-center">
                <button 
                  onClick={() => adjustAmount(-10)}
                  className="bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-500"
                >
                  -
                </button>
                <span className="text-2xl font-bold text-white">${amount}</span>
                <button 
                  onClick={() => adjustAmount(10)}
                  className="bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-500"
                >
                  +
                </button>
              </div>
              <div className="trade-amount-buttons flex gap-2">
                <button 
                  onClick={() => quickSet(1)}
                  className="amount flex-1 px-3 py-2 rounded-md bg-white text-purple-600 hover:bg-gray-100 font-semibold"
                >
                  $1
                </button>
                <button 
                  onClick={() => quickSet(10)}
                  className="amount flex-1 px-3 py-2 rounded-md bg-white text-purple-600 hover:bg-gray-100 font-semibold"
                >
                  $10
                </button>
                <button 
                  onClick={() => quickSet(50)}
                  className="amount flex-1 px-3 py-2 rounded-md bg-white text-purple-600 hover:bg-gray-100 font-semibold"
                >
                  $50
                </button>
                <button 
                  onClick={() => quickSet(1000)}
                  className="amount flex-1 px-3 py-2 rounded-md bg-white text-purple-600 hover:bg-gray-100 font-semibold"
                >
                  $1000
                </button>
                <button 
                  onClick={() => quickSet(5000)}
                  className="amount flex-1 px-3 py-2 rounded-md bg-white text-purple-600 hover:bg-gray-100 font-semibold"
                >
                  $max
                </button>
              </div>
              <button
  onClick={async () => {
    if (selectedOutcome && amount > 0) {
      try {
        const res = await placeOrder(marketId, selectedOutcome, amount);
        alert(`✅ Order placed: ${JSON.stringify(res.order)}`);
      } catch {
        alert("❌ Failed to place order");
      }
    }
  }}
  disabled={placing || !selectedOutcome || amount === 0}
  className="w-full py-3 bg-purple-600 rounded-xl text-white font-semibold text-lg hover:bg-purple-700 disabled:opacity-50"
>
  {placing ? "Placing..." : "Review trade"}
</button>
            </div>
          </div>

          
          <RelatedMarketsSection currentMarketId={marketId} />
        </div>
      </div>
    </div>
  );
}