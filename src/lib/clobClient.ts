import { config } from "./config";

export async function placeOrder(orderData: any) {
  const res = await fetch(`${config.CLOB_API_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  });
  if (!res.ok) throw new Error("Failed to place order");
  return res.json();
}

export async function cashoutPosition(positionId: string) {
  const res = await fetch(`${config.CLOB_API_URL}/positions/${positionId}/cashout`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to cashout");
  return res.json();
}
