//src/pages/api/cashout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { ClobClient, OrderType, Side } from "@polymarket/clob-client";
import { Wallet } from "ethers";
import redis from "@/lib/redis";

interface Position {
  marketId: string;
  outcome: string;
  size: number;
  price: number;
  tokenID: string;
  wallet: string;
  timestamp: number;
}


async function loadAllPositions(wallet: string): Promise<Position[]> {
  const redisKey = `orders:${wallet}`;
  const raw = await redis.lrange(redisKey, 0, -1);
  return raw.map((s) => JSON.parse(s));
}

async function saveAllPositions(wallet: string, positions: Position[]) {
  const redisKey = `orders:${wallet}`;
  await redis.del(redisKey);
  if (positions.length) {
    await redis.rpush(
      redisKey,
      ...positions.map((p) => JSON.stringify(p))
    );
  }
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { wallet, marketId, size, fullCashout = true, slippageBps = 100 } = req.body || {};
    if (!wallet || !marketId)
      return res.status(400).json({ error: "Missing wallet or marketId" });

    const pk = process.env.WALLET_PRIVATE_KEY;
    if (!pk) throw new Error("Missing WALLET_PRIVATE_KEY");
    
    const signer = new Wallet(pk);
    const host = "https://clob.polymarket.com";

    
    const clobClient = new ClobClient(host, 137, signer);
    const creds = await clobClient.createOrDeriveApiKey();
    const client = new ClobClient(host, 137, signer, creds);

    
    const positions = await loadAllPositions(wallet);
    const position = positions.find((p) => p.marketId === marketId);
    if (!position)
      return res.status(404).json({ error: "Position not found in Redis cache" });

    const cashoutSize = fullCashout
      ? position.size
      : Math.min(Number(size) || position.size, position.size);
    if (cashoutSize <= 0)
      return res.status(400).json({ error: "Invalid cashout size" });

    
    const book = await client.getOrderBook(position.tokenID);
    const bestBid = book.bids?.[0]?.price;
    if (!bestBid) throw new Error("No liquidity available for cashout");
    
    const limitPrice = parseFloat(bestBid) * (1 - slippageBps / 10_000);
    const finalPrice = Math.max(0.01, Math.min(0.99, limitPrice));
    
    const orderRes = await client.createAndPostOrder({
      tokenID: position.tokenID,
      price: finalPrice,
      side: Side.SELL,
      size: cashoutSize
    }, { tickSize: "0.01", negRisk: false }, OrderType.GTC);

    
    const updatedPositions = (() => {
      const remaining = position.size - cashoutSize;
      if (remaining <= 0) {
        return positions.filter((p) => p.tokenID !== position.tokenID);
      }
      return positions.map((p) =>
        p.tokenID === position.tokenID
          ? { ...p, size: remaining, timestamp: Date.now() }
          : p
      );
    })();

    await saveAllPositions(wallet, updatedPositions);

    return res.status(200).json({
      success: true,
      message: "Cashout order submitted",
      wallet,
      marketId,
      submitted: {
        side: "SELL",
        tokenID: position.tokenID,
        size: cashoutSize,
        limitPrice,
        bestBid: parseFloat(bestBid),
      },
      clobResponse: orderRes,
      positionsBefore: positions,
      positionsAfter: updatedPositions,
    });

  } catch (err: any) {
    console.error("Cashout error:", err?.message || err);
    return res.status(500).json({
      error: "Cashout failed",
      details: err?.message || "Unknown error",
    });
  }
}