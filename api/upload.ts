import { put } from '@vercel/blob';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const form = await request.formData();
    const file = form.get('file') as File;
    const filename = form.get('filename') as string || file.name;

    if (!file) {
      return new Response('No file provided', { status: 400 });
    }

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
    });

    return Response.json(blob);
  } catch (error) {
    console.error('Upload error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
