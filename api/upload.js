
import { put } from '@vercel/blob';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const filename = request.query.filename || 'image.png';
    
    // Subimos el archivo al Blob Store
    // request.body en Vercel functions puede ser un stream o buffer
    const blob = await put(filename, request.body, {
      access: 'public',
    });

    return response.status(200).json(blob);
  } catch (error) {
    return response.status(500).json({ error: 'Error uploading to Blob', details: error.message });
  }
}
