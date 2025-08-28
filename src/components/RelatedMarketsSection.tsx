import React from "react";
import { useRelatedMarkets } from "../hooks/useRelatedMarkets";


export function RelatedMarketsSection(props: { currentMarketId: string }) {
  const { relatedMarkets, loading } = useRelatedMarkets(props.currentMarketId);

  return (
    <div className="related-market-section card-section bg-[#1a1a1a] rounded-2xl shadow-lg p-5 flex flex-col gap-2">
      <div className="section-title text-lg font-semibold text-white">Related Markets</div>
      {loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : relatedMarkets.length === 0 ? (
        <div className="text-gray-400 text-sm">No related markets found.</div>
      ) : (
        relatedMarkets.map((m: any) => (
          <a
            key={m.id}
            href={`/market/${m.id}`}
            className="related-market flex justify-between items-center py-3 border-b last:border-b-0 border-gray-700 hover:bg-[#232323] rounded-lg transition-colors"
          >
            <div>
              <div className="related-market-title text-sm font-medium text-white mb-1">
                {m.question}
              </div>
              <div className="related-market-details text-xs text-gray-400">
                Vol: ${m.volume?.toLocaleString?.() ?? m.volume}
              </div>
            </div>
            <div className="related-market-arrow text-gray-400">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
          </a>
        ))
      )}
    </div>
  );
}
