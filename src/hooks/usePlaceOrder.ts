import { useState } from "react";

export function usePlaceOrder(token: string) {
  const [placing, setPlacing] = useState(false);

  async function placeOrder(marketId: string, outcome: string, amount: number) {
    if (!token) return;
    setPlacing(true);
    try {
      const res = await fetch("/api/placeOrder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, marketId, outcome, amount }),
      });
      if (!res.ok) throw new Error("Order failed");
      const data = await res.json();
      console.log("Order placed:", data);
    } catch (err) {
      console.error(err);
    } finally {
      setPlacing(false);
    }
  }

  return { placeOrder, placing };
}
