export const config = {
  GAMMA_API_URL: process.env.NEXT_PUBLIC_GAMMA_API_URL || "https://gamma-api.polymarket.com",
  CLOB_API_URL: process.env.NEXT_PUBLIC_CLOB_API_URL || "https://clob.polymarket.com",
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || "wss://ws-subscriptions-clob.polymarket.com/ws",
};
