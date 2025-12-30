
import Redis from "ioredis";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { runtime: 'nodejs' };

const redis = new Redis(process.env.REDIS_URL!);

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!process.env.REDIS_URL) {
    return response.status(500).json({ 
      error: 'STORAGE_NOT_CONFIGURED', 
      details: 'Variable de entorno REDIS_URL faltante.' 
    });
  }

  try {
    if (request.method === 'GET') {
      const [materials, categories, locations] = await Promise.all([
        redis.get('materials'),
        redis.get('categories'),
        redis.get('locations')
      ]);
      
      return response.status(200).json({ 
        materials: materials ? JSON.parse(materials) : [], 
        categories: categories ? JSON.parse(categories) : [],
        locations: locations ? JSON.parse(locations) : []
      });
    }

    if (request.method === 'POST') {
      const { materials, categories, locations } = request.body;
      if (materials !== undefined) await redis.set('materials', JSON.stringify(materials));
      if (categories !== undefined) await redis.set('categories', JSON.stringify(categories));
      if (locations !== undefined) await redis.set('locations', JSON.stringify(locations));
      return response.status(200).json({ success: true });
    }

    return response.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error("Redis Error:", error);
    return response.status(500).json({ error: 'DATABASE_ERROR', details: error.message });
  }
}
