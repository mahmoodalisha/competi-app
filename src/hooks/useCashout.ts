import { useState } from 'react';

interface CashoutParams {
  position: any;
  fullCashout?: boolean;
  size?: number;
}

interface CashoutResponse {
  success: boolean;
  order: any;
  cashoutValue: number;
  message: string;
}

export const useCashout = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CashoutResponse | null>(null);

  const executeCashout = async ({ position, fullCashout = true, size }: CashoutParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/cashout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ position, fullCashout, size }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to cashout');
      }
      
      setData(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { executeCashout, isLoading, error, data };
};