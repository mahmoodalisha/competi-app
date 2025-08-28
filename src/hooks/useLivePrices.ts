// src/hooks/useLivePrices.ts
import { useEffect, useState } from 'react';

export const useLivePrices = (marketIds: string[]) => {
  const [prices, setPrices] = useState<Record<string, { bestBid: number; bestAsk: number }>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [isPricesLoading, setIsPricesLoading] = useState(true); 

  useEffect(() => {
    if (marketIds.length === 0) {
      setIsPricesLoading(false);
      return;
    }

    const ws = new WebSocket(
      process.env.NEXT_PUBLIC_CLOB_WS_URL || 'wss://ws-subscriptions-clob.polymarket.com/ws'
    );

    ws.onopen = () => {
      setIsConnected(true);
      marketIds.forEach(marketId => {
        ws.send(
          JSON.stringify({
            type: 'subscribe',
            channel: 'orderbook',
            id: marketId,
          })
        );
      });
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'orderbook_update') {
        setPrices(prev => ({
          ...prev,
          [data.market_id]: {
            bestBid: data.bids?.length > 0 ? parseFloat(data.bids[0].price) : 0,
            bestAsk: data.asks?.length > 0 ? parseFloat(data.asks[0].price) : 0,
          },
        }));
        setIsPricesLoading(false); 
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [marketIds]);

  return { prices, isConnected, isPricesLoading }; 
};
