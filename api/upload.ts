
import { put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  runtime: 'nodejs',
  api: {
    bodyParser: false,
  },
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return response.status(500).json({ 
      error: 'Configuración incompleta', 
      details: 'Falta la variable BLOB_READ_WRITE_TOKEN. Conecta Vercel Blob en la pestaña Storage.' 
    });
  }

  try {
    const filename = (request.query.filename as string) || 'image.png';
    
    // Al deshabilitar bodyParser, request intercepta el stream directamente
    const blob = await put(filename, request, {
      access: 'public',
    });

    return response.status(200).json(blob);
  } catch (error: any) {
    return response.status(500).json({ error: 'Error uploading to Blob', details: error.message });
  }
}
