import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw new Error("Missing REDIS_URL in .env");

const redis = new Redis(redisUrl);

export default redis;
