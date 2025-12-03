
import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  if (request.method === 'GET') {
    try {
      // Intentamos obtener los datos. Si no existen, devolvemos null para que el frontend use los valores por defecto.
      const materials = await kv.get('materials');
      const categories = await kv.get('categories');
      
      return response.status(200).json({ 
        materials: materials || [], 
        categories: categories || [] 
      });
    } catch (error) {
      return response.status(500).json({ error: 'Error reading from KV', details: error.message });
    }
  }

  if (request.method === 'POST') {
    try {
      const { materials, categories } = request.body;

      // Guardamos los datos en KV
      if (materials) await kv.set('materials', materials);
      if (categories) await kv.set('categories', categories);

      return response.status(200).json({ success: true });
    } catch (error) {
      return response.status(500).json({ error: 'Error writing to KV', details: error.message });
    }
  }

  return response.status(405).json({ error: 'Method not allowed' });
}
