import { useState } from 'react';
import { usePositions } from '@/hooks/usePositions';
import { useCashout } from '@/hooks/useCashout';
import { useLivePrices } from '@/hooks/useLivePrices';

interface Position {
  id: string;
  market_id: string;
  side: string;
  price: number;
  size: number;
  realized_pnl: number;
  unrealized_pnl: number;
  cashout_value: number;
  market_title: string;
  currentPrice?: number;
}


interface EnhancedPosition extends Position {
  currentPrice: number;
  cashoutValue: number;
}

export default function CashoutPage() {
  const { positions, loading: positionsLoading, error: positionsError, refetch } = usePositions(null);
  const { executeCashout, isLoading: cashoutLoading } = useCashout();
  const [cashoutStatus, setCashoutStatus] = useState<Record<string, string>>({});

  // Get market IDs for live pricing
  const marketIds = positions.map((p: Position) => p.market_id);
  const { prices, isConnected } = useLivePrices(marketIds);

  
  const enhancedPositions: EnhancedPosition[] = positions.map((position: Position) => {
    const marketPrice = prices[position.market_id];
    let currentPrice = position.currentPrice || 0;
    let cashoutValue = position.cashout_value || 0;

    if (marketPrice) {
      currentPrice = position.side === 'buy' ? marketPrice.bestBid : marketPrice.bestAsk;
      cashoutValue = currentPrice * position.size;
    }

    return {
      ...position,
      currentPrice,
      cashoutValue,
    };
  });

  const handleCashout = async (position: EnhancedPosition) => {
    try {
      setCashoutStatus(prev => ({ ...prev, [position.id]: 'processing' }));
      await executeCashout({ position });
      setCashoutStatus(prev => ({ ...prev, [position.id]: 'success' }));

      // Refresh positions after cashout
      setTimeout(() => refetch(), 2000);
    } catch (error) {
      setCashoutStatus(prev => ({ ...prev, [position.id]: 'error' }));
      console.error('Cashout failed:', error);
    }
  };

  if (positionsLoading) return <div className="p-4">Loading positions...</div>;
  if (positionsError) return <div className="p-4 text-red-500">Error loading positions: {positionsError}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Your Positions</h1>
      <div className="mb-4">
        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
        Live prices: {isConnected ? 'Connected' : 'Disconnected'}
      </div>

      {enhancedPositions.length === 0 ? (
        <p>No open positions found.</p>
      ) : (
        <div className="grid gap-4">
          {enhancedPositions.map(position => (
            <div key={position.id} className="border p-4 rounded-lg">
              <h2 className="text-xl font-semibold">{position.market_title}</h2>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <p>
                    Side:{' '}
                    <span className={position.side === 'buy' ? 'text-green-600' : 'text-red-600'}>
                      {position.side.toUpperCase()}
                    </span>
                  </p>
                  <p>Size: {position.size}</p>
                  <p>Entry Price: {position.price.toFixed(4)}</p>
                </div>
                <div>
                  <p>Current Price: {position.currentPrice.toFixed(4)}</p>
                  <p>P/L: {(position.unrealized_pnl || 0).toFixed(4)}</p>
                  <p className="font-bold">Cashout Value: ${position.cashoutValue.toFixed(2)}</p>
                </div>
              </div>

              <button
                onClick={() => handleCashout(position)}
                disabled={cashoutLoading || cashoutStatus[position.id] === 'processing' || !position.currentPrice}
                className={`mt-3 px-4 py-2 rounded ${
                  cashoutLoading || cashoutStatus[position.id] === 'processing' || !position.currentPrice
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {cashoutStatus[position.id] === 'processing'
                  ? 'Processing...'
                  : `Cashout $${position.cashoutValue.toFixed(2)}`}
              </button>

              {cashoutStatus[position.id] === 'success' && (
                <p className="text-green-600 mt-2">Cashout successful!</p>
              )}
              {cashoutStatus[position.id] === 'error' && (
                <p className="text-red-600 mt-2">Cashout failed. Please try again.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
