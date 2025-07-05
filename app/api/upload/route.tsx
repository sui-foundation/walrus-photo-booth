import { NextResponse } from 'next/server';

const tuskyApiKey = process.env.TUSKY_API_KEY || '';
const tuskyVaultID = process.env.NEXT_PUBLIC_TUSKY_VAULT_ID || '';

export async function POST(request: Request) {
  try {
    const blob = await request.blob();
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/:/g, '-')
      .replace(/\..+/, '')
      .replace('T', '_');
    const fileName = `photo_${timestamp}`;

    // Update the metadata to use the generated filename
    const metaData = {
      vaultId: tuskyVaultID, 
      parentId: request.headers.get('TuskyID') || '', // Use the parentId from the request headers
      name: fileName, 
      type: 'image/png',
      filename: fileName,
      filetype: 'image/png',
    };
    // Convert metadata to the required tus format (key-value pairs in base64)
    const metaDataString = Object.entries(metaData)
      .map(([key, value]) => `${key} ${btoa(String(value))}`)
      .join(',');
      
    const response = await fetch('https://api.tusky.io/uploads/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/offset+octet-stream',
        'Content-Length': blob.size.toString(),
        'Api-Key': tuskyApiKey,
        'Upload-Length': blob.size.toString(),
        'Upload-Metadata': metaDataString,
        'Tus-Resumable': '1.0.0'
      },
      body: blob,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();

    return NextResponse.json({ message: 'Upload successful', data: result });
  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json({ message: 'Error processing upload' }, { status: 500 });
  }
}