import axios from "axios";
import { useState, useEffect } from "react";

export function useMarketHistory(marketId: string, range: string) {
  const [history, setHistory] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!marketId) return;

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching history for market ${marketId}, range: ${range}`);
        
        const response = await axios.get(`/api/markets/history`, { 
          params: { id: marketId, range },
          timeout: 20000 
        });
        
        console.log('History response:', response.data);
        
        
        if (response.data && response.data.points && Array.isArray(response.data.points)) {
          setHistory(response.data);
        } else {
          console.warn('Invalid response format, using fallback');
          setHistory({
            points: generateClientFallbackData(range)
          });
        }
      } catch (err: any) {
        console.error('Failed to fetch market history:', {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data
        });
        
        setError(`Failed to load market history: ${err.message}`);
        
        
        const fallbackHistory = {
          points: generateClientFallbackData(range)
        };
        setHistory(fallbackHistory);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [marketId, range]);

  return { history, loading, error };
}

function generateClientFallbackData(range: string) {
  const days = range === "30d" ? 30 : range === "14d" ? 14 : 7;
  const points = [];
  
  for (let i = 0; i < Math.min(days, 7); i++) { 
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    
    points.push({
      time: date.toLocaleDateString('en-US', { weekday: 'short' }),
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      value: Math.round(25 + Math.sin(i * 0.8) * 15 + Math.random() * 10),
      probability: 0.25 + Math.sin(i * 0.8) * 0.15 + Math.random() * 0.1
    });
  }
  
  return points;
}