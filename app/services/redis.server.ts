import * as redis from "redis";

const client = redis.createClient({
  url: process.env.REDIS_URL,
});

client.on("error", (err) => console.log("Redis client error", err));

// If you update the data type, update the key version so you are not left with invalid states
const KEY_VERSION = "1";

client.connect();

export async function cached<T>(cacheKey: string, callback: () => T): Promise<T> {

  let cachedData = await client.get(cacheKey);

  if(cachedData) {
    return JSON.parse(cachedData)
  } else {
    const results = await callback();

    await client.set(cacheKey, JSON.stringify(results));
    await client.expire(cacheKey, 3600);

    return results;
  }
};

export const REDIS_CLIENT = client;
