import { useState } from "react";
import axios from "axios";

export const useCashout = (token: string) => {
  const [loading, setLoading] = useState(false);

  const cashoutPosition = async (positionId: string, amount: number) => {
    if (!token) return;
    setLoading(true);
    try {
      await axios.post("/api/cashout", { token, tokenId: positionId, amount });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return { cashoutPosition, cashoutLoading: loading };
};
