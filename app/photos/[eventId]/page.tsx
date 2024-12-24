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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from '@/components/ui/dialog'

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

interface DateTimeFormatOptions {
  weekday?: 'narrow' | 'short' | 'long';
  month?: 'narrow' | 'short' | 'long' | 'numeric' | '2-digit';
  day?: 'numeric' | '2-digit';
  year?: 'numeric' | '2-digit';
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  hour12?: boolean;
  timeZoneName?: 'short' | 'long';
}

const PhotosPage = ({ params }: { params: Promise<{ eventId: string }> }) => {
  const resolvedParams = use(params);
  const [currentAdminId, setCurrentAdminId] = useState<number | null>(null);
  const [eventDetails, setEventDetails] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const { isConnected, emailAddress } = useCustomWallet();
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
        console.error('Error fetching event details:', error);
      } else {
        if (events[0]) {
          const options: DateTimeFormatOptions = {
            weekday: 'short',
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZoneName: 'short',
          };
          const id = events[0].id;
          const et = events[0].event_title.toUpperCase();
          const ed = new Date(events[0].event_date).toLocaleString([], options);
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
        console.error('Error fetching admin:', error);
      } else {
        if (admins.length > 0) setCurrentAdminId(admins[0].id);
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
      console.error('Error deleting photo:', error);
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
    <main className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      <div className='container mx-auto px-4 py-12'>
        <div className='w-full flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg'>
          <div className='space-y-2'>
            <h1 className='text-4xl font-bold text-gray-900 dark:text-white'>
              {eventDetails?.event_title}
            </h1>
            <h2 className='text-lg text-gray-600 dark:text-gray-300'>
              {eventDetails?.event_date}
            </h2>
            <Link 
              href='/' 
              className='inline-block text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors'
            >
              ← Back to Events
            </Link>
          </div>
          
          <div className='flex items-center gap-4'>
            {isConnected && currentAdminId && (
              <>
                <Link
                  href='/addEvent'
                  className='flex items-center justify-center rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors py-2.5 px-6'
                >
                  + Event
                </Link>
                <Link
                  href='/photo-booth'
                  className='flex items-center justify-center rounded-lg text-sm font-medium text-gray-900 bg-gray-100 hover:bg-gray-200 transition-colors py-2.5 px-6'
                >
                  Booth
                </Link>
              </>
            )}
            <ProfilePopover />
          </div>
        </div>

        {photos.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-lg text-gray-600 dark:text-gray-400'>
              No photos found for this event yet.
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {photos.map((photo) => (
              <div 
                key={photo.blob_id} 
                className='bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg transition-transform hover:scale-[1.02]'
              >
                <Dialog>
                  <DialogTrigger asChild>
                    <div className='relative aspect-[3/2] cursor-pointer'>
                      <Image
                        src={`https://aggregator.walrus-testnet.walrus.space/v1/${photo.blob_id}`}
                        alt={`Photo ${photo.blob_id}`}
                        className='object-contain hover:opacity-90 transition-opacity'
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
                    <DialogTitle className="sr-only">
                      Photo from {eventDetails?.event_title}
                    </DialogTitle>
                    <div className="relative w-full h-[90vh]">
                      <Image
                        src={`https://aggregator.walrus-testnet.walrus.space/v1/${photo.blob_id}`}
                        alt={`Photo ${photo.blob_id}`}
                        className='object-contain'
                        fill
                        sizes="90vw"
                        priority
                      />
                    </div>
                  </DialogContent>
                </Dialog>
                <div className='p-5'>
                  <div className='space-y-2 mb-4'>
                    <div className='flex items-center gap-2'>
                      <span className='text-xs font-semibold uppercase text-gray-500 dark:text-gray-400'>
                        Blob ID:
                      </span>
                      <span className='text-sm font-mono text-gray-700 dark:text-gray-300 truncate'>
                        {photo.blob_id}
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-xs font-semibold uppercase text-gray-500 dark:text-gray-400'>
                        Object ID:
                      </span>
                      <Link
                        href={`https://suiscan.xyz/testnet/object/${photo.object_id}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-sm font-mono text-indigo-600 dark:text-indigo-400 hover:underline truncate'
                      >
                        {photo.object_id}
                      </Link>
                    </div>
                  </div>
                  {isConnected && eventDetails?.admin_id === currentAdminId && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className='w-full mt-2 bg-red-600 hover:bg-red-700 text-white transition-colors'>
                          <TrashIcon className='mr-2 h-4 w-4' />
                          Delete Photo
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className='bg-white dark:bg-gray-800'>
                        <AlertDialogHeader>
                          <AlertDialogTitle className='text-gray-900 dark:text-white'>
                            Are you sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription className='text-gray-600 dark:text-gray-400'>
                            Delete photo {photo.blob_id}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className='bg-gray-100 hover:bg-gray-200 text-gray-900'>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeletePhoto(photo.blob_id)}
                            className='bg-red-600 hover:bg-red-700 text-white'
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default PhotosPage;
