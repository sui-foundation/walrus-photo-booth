import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PUBLISHER_URL = 'https://publisher.walrus-testnet.walrus.space';

const supabaseUrl = ""
const supabaseKey = ""

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const blob = await request.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // upload to walrus
    const response = await fetch(`${PUBLISHER_URL}/v1/store?epochs=5`, {
      method: 'PUT',
      body: buffer,
      headers: {
        'Content-Type': blob.type,
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    // save to supabase if walrus upload was successful
    if (result?.newlyCreated?.blobObject) {
      const { error } = await supabase
        .from('photos')
        .insert([{
          blob_id: result.newlyCreated.blobObject.blobId,
          object_id: result.newlyCreated.blobObject.id,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error saving to Supabase:', error);
        throw new Error('Failed to save to database');
      }
    }

    return NextResponse.json({ message: 'Upload successful', data: result });
  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json({ message: 'Error processing upload' }, { status: 500 });
  }
}