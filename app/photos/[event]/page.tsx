'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

interface Photo {
  id: number;
  created_at: string;
  blob_id: string;
  object_id: string;
  event_id: string | null;
  user: string | null;
}

export default function PhotosPage({
  params,
}: {
  params: Promise<{ event: string }>;
}) {
  const resolvedParams = use(params);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      const { data, error } = await supabase
        .from('photos')
        .select('blob_id, object_id, event_id')
        .eq('event_id', resolvedParams.event);

      if (error) {
        setError(error);
        console.error('Error fetching photos:', error);
      } else {
        setPhotos((data as Photo[]) || []);
      }
    };

    fetchPhotos();
  }, [resolvedParams.event]);

  if (error) {
    return <div>Error loading photos</div>;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Event: {resolvedParams.event_id}</h1>
      
      {photos.length === 0 ? (
        <p>No photos found for this event.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <div key={photo.blob_id} className="border rounded-lg p-4">
              <Image 
                src={`https://aggregator.walrus-testnet.walrus.space/v1/${photo.blob_id}`}
                alt={`Photo ${photo.blob_id}`}
                className="w-full h-48 object-cover mb-4 rounded"
                width={500}
                height={300}
              />
              <p className="text-sm mb-2">Blob ID: {photo.blob_id}</p>
              <p className="text-sm mb-2">
                Object ID:{' '}
                <Link 
                  href={`https://suiscan.xyz/testnet/object/${photo.object_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {photo.object_id}
                </Link>
              </p>
              <p className="text-sm">Event: {photo.event_id || 'No event specified'}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
