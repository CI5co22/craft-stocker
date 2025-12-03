import { put, list } from '@vercel/blob';

export const config = {
    runtime: 'edge',
};

const DATA_FILE = 'inventory.json';

export default async function handler(request: Request) {
    try {
        if (request.method === 'GET') {
            // List files to find our data file
            const { blobs } = await list({ prefix: DATA_FILE, limit: 1 });

            if (blobs.length === 0) {
                // Return empty structure if file doesn't exist yet
                return Response.json({ materials: [], categories: [] });
            }

            // Fetch the actual JSON content
            const response = await fetch(blobs[0].url);
            const data = await response.json();

            return Response.json(data);
        }

        if (request.method === 'POST') {
            const data = await request.json();

            // Save data to Blob, overwriting the existing file
            const blob = await put(DATA_FILE, JSON.stringify(data), {
                access: 'public',
                addRandomSuffix: false, // Important to keep the same filename/url
                contentType: 'application/json'
            });

            return Response.json({ success: true, url: blob.url });
        }

        return new Response('Method not allowed', { status: 405 });
    } catch (error) {
        console.error('Inventory API error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
