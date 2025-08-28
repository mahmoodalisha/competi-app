import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useCashout, Position } from "@/hooks/useCashout";
import { useLivePrices } from "@/hooks/useLivePrices";

interface TokenPayload {
  wallet: string;
}

export default function CashoutPage() {
  const [wallet, setWallet] = useState<string | null>(null);
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const token = searchParams.get("token") || "";

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode<TokenPayload>(token);
        if (decoded.wallet) setWallet(decoded.wallet);
        else console.error("JWT missing wallet field");
      } catch (err) {
        console.error("Invalid token:", err);
      }
    }
  }, [token]);

  const { positions, loading, error, submitCashout } = useCashout(token);

  
  const marketIds = positions.map((p) => p.marketId);
  const { prices, isConnected, isPricesLoading } = useLivePrices(marketIds);

  if (!wallet) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
        <p className="text-red-400 text-lg font-medium">Invalid or missing session token.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8 p-4 bg-gray-800 rounded-lg">
          <h1 className="text-2xl font-bold text-purple-400 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Cashout Positions
          </h1>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${isConnected ? "text-green-400" : "text-red-400"}`}>
              <div className={`h-3 w-3 rounded-full mr-2 ${isConnected ? "bg-green-400" : "bg-red-400"}`}></div>
              {isConnected ? "Live" : "Disconnected"}
            </div>
            <div className="text-sm bg-gray-700 px-3 py-1 rounded-md">
              Wallet: {wallet.substring(0, 6)}...{wallet.substring(wallet.length - 4)}
            </div>
          </div>
        </header>

        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-200 font-medium">{error}</p>
          </div>
        )}

        {!loading && positions.length === 0 && (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xl text-gray-400">No positions available for cashout</p>
          </div>
        )}

        <div className="grid gap-5">
          {positions.map((pos: Position) => {
            const marketPrice = prices[pos.marketId] || { bestBid: 0, bestAsk: 0 };
            const priceChangeColor = marketPrice.bestBid > pos.price ? "text-green-400" : "text-red-400";
            
            return (
              <div key={pos.tokenID} className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-lg">
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className="bg-purple-900/30 rounded-md px-3 py-1 mr-3">
                        <span className="font-semibold text-purple-300">{pos.marketId.substring(0, 8)}</span>
                      </div>
                      <h3 className="text-lg font-bold">{pos.outcome}</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-400">Position Size</p>
                        <p className="font-mono font-medium">{pos.size}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Entry Price</p>
                        <p className="font-mono">{pos.price}</p>
                      </div>
                    </div>
                    
                    {!isPricesLoading && (
                      <div className="bg-gray-900 rounded-lg p-3">
                        <p className="text-sm text-gray-400 mb-1">Live Market Prices</p>
                        <div className="flex justify-between">
                          <div>
                            <span className="text-gray-500 text-sm">Bid: </span>
                            <span className="font-mono">{marketPrice.bestBid.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-sm">Ask: </span>
                            <span className="font-mono">{marketPrice.bestAsk.toFixed(2)}</span>
                          </div>
                          <div className={priceChangeColor}>
                            <span className="text-sm">{marketPrice.bestBid > pos.price ? "▲" : "▼"}</span>
                            <span className="font-mono ml-1">
                              {Math.abs(marketPrice.bestBid - pos.price).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col justify-center space-y-3 mt-4 md:mt-0 md:ml-4">
                    <button
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-purple-500/20"
                      onClick={async () => {
                        try {
                          await submitCashout(pos);
                          alert(`Full cashout submitted for ${pos.outcome}`);
                        } catch {
                          alert("Cashout failed");
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Cashout All
                    </button>
                    <button
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center border border-purple-400/30"
                      onClick={async () => {
                        const partial = parseFloat(prompt("Enter partial size:") || "0");
                        if (partial > 0) {
                          try {
                            await submitCashout(pos, partial);
                            alert(`Partial cashout of ${partial} submitted for ${pos.outcome}`);
                          } catch {
                            alert("Cashout failed");
                          }
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Partial Cashout
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}