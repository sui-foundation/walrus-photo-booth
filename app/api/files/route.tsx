import { NextResponse } from 'next/server';

const tuskyApiKey = process.env.TUSKY_API_KEY || '';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const tusky_id = pathParts[pathParts.length - 1];

    const response = await fetch(`https://api.tusky.io/files/${tusky_id}`, {
      method: 'GET',
      headers: {
        'Api-Key': tuskyApiKey,
      }
    });

    if (!response.ok) {
      throw new Error(`Fetch file failed: ${response.statusText}`);
    }

    const result = await response.json();

    // Map logic for message
    let message = 'Fetch file successful';
    if (result && Array.isArray(result)) {
      message = result.map((item: { message?: string }) => item.message || 'No message').join('; ');
    } else if (result && result.message) {
      message = result.message;
    }

    return NextResponse.json({ message, data: result });
  } catch (error) {
    console.error('Error processing fetch file:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}