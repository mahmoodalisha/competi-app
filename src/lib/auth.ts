import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL!);

export async function verifySessionToken(token: string) {
  if (!token) return null;

  const discordId = await redis.get(`session:${token}`);
  if (!discordId) return null;

  // Fetch wallet for this Discord ID
  const walletAddress = await redis.get(`wallet:${discordId}`);
  if (!walletAddress) return null;

  return { discordId, walletAddress };
}
