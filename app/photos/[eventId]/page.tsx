'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import ProfilePopover from '@/components/ProfilePopover';
import { useCustomWallet } from '@/contexts/CustomWallet';
import { Button } from '@/components/ui/button';
import { TrashIcon } from '@radix-ui/react-icons';
import Loading from '@/components/Loading';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Photo {
  id: number;
  created_at: string;
  blob_id: string;
  object_id: string;
  event_id: number;
  user: string | null;
}

interface Event {
  id: number;
  created_at: string;
  event_title: string;
  event_date: string;
  admin_id: number;
}

const PhotosPage = ({ params }: { params: Promise<{ eventId: string }> }) => {
  const resolvedParams = use(params);
  const [currentAdminId, setCurrentAdminId] = useState<number | null>(null);
  const [eventDetails, setEventDetails] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const { isConnected, emailAddress } = useCustomWallet();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isConnected) {
    }
    setIsLoading(false);
  }, [isConnected]);

  useEffect(() => {
    const fetchPhotos = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('photos')
        .select('blob_id, object_id, event_id')
        .eq('event_id', resolvedParams.eventId);

      if (error) {
        setError(error);
        console.error('Error fetching photos:', error);
      } else {
        setPhotos((data as Photo[]) || []);
      }
      setIsLoading(false);
    };

    fetchPhotos();
  }, [resolvedParams.eventId]);

  useEffect(() => {
    const fetchEventDetails = async () => {
      setIsLoading(true);
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', resolvedParams.eventId);

      if (error) {
        setError(error);
        console.error('Error fetching event name:', error);
      } else {
        if (events[0]) {
          const id = events[0].id;
          const et = events[0].event_title.toUpperCase();
          const ed = new Date(events[0].event_date).toString();
          const ca = new Date(events[0].created_at).toString();
          const ai = events[0].admin_id;
          setEventDetails({
            id: id,
            event_title: et,
            event_date: ed,
            created_at: ca,
            admin_id: ai,
          } as Event);
        }
      }
      setIsLoading(false);
    };

    fetchEventDetails();
  }, [resolvedParams.eventId]);

  useEffect(() => {
    const fetchCurrentAdmin = async () => {
      setIsLoading(true);
      const { data: admins, error } = await supabase
        .from('admins')
        .select('id')
        .eq('email', emailAddress);

      if (error) {
        setError(error);
        console.error('Error fetching events:', error);
      } else {
        if (admins[0]) setCurrentAdminId(admins[0].id);
      }
      setIsLoading(false);
    };

    fetchCurrentAdmin();
  }, [emailAddress]);

  const handleDeletePhoto = async (blob_id: string) => {
    setIsLoading(true);
    const { error } = await supabase
      .from('photos')
      .delete()
      .eq('blob_id', blob_id);

    if (error) {
      setError(error);
      console.error('Error deleting event:', error);
    } else {
      setPhotos(photos.filter((photo) => photo.blob_id !== blob_id));
    }
    setIsLoading(false);
  };

  if (error) {
    return <div>Error loading photos</div>;
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <main className='container mx-auto px-4 py-8'>
      <div className='w-full flex items-center justify-between relative mb-10'>
        <div>
          <h1 className='text-3xl font-bold'>{eventDetails?.event_title}</h1>
          <h2 className='text-lg font-bold'>
            Date: {eventDetails?.event_date}
          </h2>
          <p className='text-xs font-bold'>
            Created: {eventDetails?.created_at}
          </p>
          <Link href='/' className='underline'>
            Back to Events
          </Link>
        </div>
        <div className='flex items-center gap-4'>
          {isConnected && (
            <>
              <Link
                href='/addEvent'
                className='flex items-center justify-center rounded-md text-sm text-white bg-gray-500 py-2 px-6'
              >
                + Event
              </Link>
              <Link
                href='/photo-booth'
                className='flex items-center justify-center rounded-md text-sm text-black bg-gray-300 py-2 px-6'
              >
                Booth
              </Link>
            </>
          )}
          <ProfilePopover />
        </div>
      </div>

      {photos.length === 0 ? (
        <>
          <p>No photos found for this event yet.</p>
          {isConnected && <Button>Activate Cam?</Button>}
        </>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {photos.map((photo) => (
            <div key={photo.blob_id} className='border rounded-lg p-4'>
              <Image
                src={`https://aggregator.walrus-testnet.walrus.space/v1/${photo.blob_id}`}
                alt={`Photo ${photo.blob_id}`}
                className='w-full h-48 object-cover mb-4 rounded'
                width={500}
                height={300}
              />
              <p className='text-sm mb-2'>Blob ID: {photo.blob_id}</p>
              <p className='text-sm mb-2'>
                Object ID:{' '}
                <Link
                  href={`https://suiscan.xyz/testnet/object/${photo.object_id}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-blue-500 hover:underline'
                >
                  {photo.object_id}
                </Link>
              </p>
              <p className='text-sm'>
                Event: {photo.event_id || 'No event specified'}
              </p>
              {isConnected && eventDetails?.admin_id === currentAdminId && (
                <Button
                  onClick={() => handleDeletePhoto(photo.blob_id)}
                  className='cursor-pointer'
                >
                  <TrashIcon />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default PhotosPage;
