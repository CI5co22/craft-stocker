import Redis from "ioredis";
import type { VercelRequest, VercelResponse } from '@vercel/node';

const redis = new Redis(process.env.REDIS_URL!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    try {
      const materials = await redis.get("materials");
      const categories = await redis.get("categories");

      return res.status(200).json({
        materials: materials ? JSON.parse(materials) : [],
        categories: categories ? JSON.parse(categories) : [],
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Redis GET error", details: err.message });
    }
  }

  if (req.method === "POST") {
    try {
      const { materials, categories } = req.body;

      if (materials) {
        await redis.set("materials", JSON.stringify(materials));
      }

      if (categories) {
        await redis.set("categories", JSON.stringify(categories));
      }

      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: "Redis SET error", details: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
