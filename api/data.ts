import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method === 'GET') {
    try {
      const materials = await kv.get('materials');
      const categories = await kv.get('categories');
      
      return response.status(200).json({ 
        materials: materials || [], 
        categories: categories || [] 
      });
    } catch (error: any) {
      return response.status(500).json({ error: 'Error reading from KV', details: error.message });
    }
  }

  if (request.method === 'POST') {
    try {
      const { materials, categories } = request.body;

      if (materials) await kv.set('materials', materials);
      if (categories) await kv.set('categories', categories);

      return response.status(200).json({ success: true });
    } catch (error: any) {
      return response.status(500).json({ error: 'Error writing to KV', details: error.message });
    }
  }

  return response.status(405).json({ error: 'Method not allowed' });
}