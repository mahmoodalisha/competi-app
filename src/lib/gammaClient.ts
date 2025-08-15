import { config } from "./config";

export async function getMarkets() {
  const res = await fetch(`${config.GAMMA_API_URL}/markets`);
  if (!res.ok) throw new Error("Failed to fetch markets");
  return res.json();
}

export async function getMarketById(id: string) {
  const res = await fetch(`${config.GAMMA_API_URL}/markets/${id}`);
  if (!res.ok) throw new Error("Failed to fetch market");
  return res.json();
}
