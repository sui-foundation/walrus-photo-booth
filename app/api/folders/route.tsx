import { NextResponse } from 'next/server';

const tuskyApiKey = process.env.TUSKY_API_KEY || '';
const tuskyVaultID = process.env.NEXT_PUBLIC_TUSKY_VAULT_ID || '';

export async function POST(request: Request) {
  try {
    const bodyData = await request.json();
    const response = await fetch('https://api.tusky.io/folders/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': tuskyApiKey
        },
      body: JSON.stringify({
        name: bodyData.name,
        vaultId: tuskyVaultID,
      }),
    });

    if (!response.ok) {
      throw new Error(`Create folder failed: ${response.statusText}`);
    }

    const result = await response.json();

    return NextResponse.json({ message: 'Create folder successful', data: result });
  } catch (error) {
    console.error('Error processing create folder:', error);
    return NextResponse.json({ message: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
  }
}