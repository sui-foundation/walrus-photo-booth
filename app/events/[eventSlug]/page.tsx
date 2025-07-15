'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
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
  DialogClose,
} from '@/components/ui/dialog';
import UnifiedHeader from '@/components/UnifiedHeader';

const AGGREGATOR_URL = process.env.NEXT_PUBLIC_AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space';

interface Photo {
  id: number;
  created_at: string;
  blob_id: string;
  object_id: string;
  event_id: number;
  user: string | null;
  tusky_id: string;
}

interface Event {
  id: number;
  created_at: string;
  event_title: string;
  event_slug: string;
  event_date: string;
  admin_id: number;
  tusky_id: string;
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

const fadeInAnimation = `
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
`;

const EventPage = ({ params }: { params: Promise<{ eventSlug: string }> }) => {
  const resolvedParams = use(params);
  const [currentAdminId, setCurrentAdminId] = useState<number | null>(null);
  const [eventDetails, setEventDetails] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);

  const { isConnected, emailAddress } = useCustomWallet();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const photoId = urlParams.get('photoId');
    if (photoId) {
      setSelectedPhotoId(photoId);
    }
  }, []);

  useEffect(() => {
    // Function to get blob_id from Tusky API for photos without blob_id
    const fetchTuskyPhotos = async () => {
      if (!eventDetails?.id) return;

      // Find photos that have tusky_id but no blob_id
      const photosToUpdate = photos.filter(photo => !photo.blob_id && photo.tusky_id);

      for (const photo of photosToUpdate) {
        if (!photo.tusky_id) continue;
        try {
          const response = await fetch(`/api/files/${photo.tusky_id}`,
            {
              method: 'GET'
            }
          );
          if (!response.ok) {
            console.error(`Failed to fetch Tusky file for ${photo.tusky_id}: ${response.statusText}`);
            continue;
          }

          const data = await response.json();
          if (data && data.blob_id != "unknown") {
            // Update photo in the state with the new blob_id
            setPhotos(prevPhotos =>
              prevPhotos.map(p =>
                p.tusky_id === photo.tusky_id
                  ? { ...p, blob_id: data.blob_id }
                  : p
              )
            );

            // Optionally update in database
            await supabase
              .from('photos')
              .update({ blob_id: data.blob_id })
              .eq('tusky_id', photo.tusky_id);
          }
        } catch (error) {
          console.error(`Error fetching Tusky data for ${photo.tusky_id}:`, error);
        }
      }
    };

    const fetchPhotos = async () => {
      if (!eventDetails?.id) return;

      setIsLoading(true);
      const { data, error } = await supabase
        .from('photos')
        .select('blob_id, object_id, event_id, created_at, tusky_id')
        .eq('event_id', eventDetails?.id)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error);
        console.error('Error fetching photos:', error);
      } else {
        setPhotos((data as Photo[]) || []);
      }
      setIsLoading(false);
      fetchTuskyPhotos();
    };

    fetchPhotos();

  }, [eventDetails?.id]);

  useEffect(() => {
    const fetchEventDetails = async () => {
      setIsLoading(true);
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('event_slug', resolvedParams.eventSlug);

      if (error) {
        setError(error);
        console.error('Error fetching event details:', error);
      } else {
        if (events[0]) {
          const options: DateTimeFormatOptions = {
            month: 'long',
            day: '2-digit',
            year: 'numeric',
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
  }, [resolvedParams.eventSlug]);

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

  const handleDeletePhoto = async (tusky_id: string) => {
    setIsLoading(true);

    const { error } = await supabase
      .from('photos')
      .delete()
      .eq('tusky_id', tusky_id);

    if (error) {
      setError(error);
      console.error('Error deleting photo:', error);
    } else {
      setPhotos(photos.filter((photo) => photo.tusky_id !== tusky_id));
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
    <main className="min-h-screen bg-white text-black pb-6">
      <UnifiedHeader
        variant="minimal"
        showBranding={true}
        rightContent={
          <Link
            href="/"
            className="rounded-lg p-1 hover:bg-neutral-800 transition flex items-center justify-center"
            aria-label="Back to Home"
            style={{ width: 40, height: 40 }}
          >
            <Image
              src="/HeaderLogo.png"
              alt="Exit"
              width={28}
              height={28}
              className="rounded"
              priority
            />
          </Link>
        }
      />
      <div className="bg-neutral-900 text-white">
        <div className="px-4 pb-4 pt-4">
          <h1 className="text-2xl font-semibold tracking-wide uppercase">
            {eventDetails?.event_title}
          </h1>
          <div className="h-1 w-32 bg-sky-400 mt-3 mb-4 rounded" />
          <div className="flex items-center gap-3 text-gray-300 text-base font-mono">
            <span>
              {eventDetails?.event_date}
            </span>
            <span className="mx-2">•</span>
            <span>
              {photos.length.toLocaleString()} photos
            </span>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12">
        {photos.length === 0 ? (
          <div className='text-center py-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl'>
            <p className='text-lg text-gray-600 dark:text-gray-400'>
              No photos found for this event yet.
            </p>
          </div>
        ) : (
          <>
            <style>{fadeInAnimation}</style>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 p-3'>
              {photos.map((photo, index) => {
                const photoUrl = photo?.blob_id && photo?.blob_id !== 'unknown'
                  ? `${AGGREGATOR_URL}/v1/blobs/${photo?.blob_id}`
                  : `https://cdn.tusky.io/${photo?.tusky_id}`;
                return (
                  <div
                    key={photo.tusky_id}
                    style={{
                      animation: `fadeIn 0.6s ease-out ${index * 0.1}s both`,
                    }}
                    className='relative bg-white/90 dark:bg-gray-800/90 p-4 rounded-lg shadow-sm aspect-square flex flex-col items-center justify-center mb-3 transform-gpu hover:scale-[1.02] hover:shadow-lg transition-all duration-300 break-inside-avoid group'
                  >

                    <Dialog open={selectedPhotoId === photo.tusky_id} onOpenChange={(isOpen) => setSelectedPhotoId(isOpen ? photo.tusky_id : null)}>
                      <DialogTrigger asChild>
                        <div
                          className='relative w-[80%] h-full cursor-pointer z-10'
                          onClick={() => setSelectedPhotoId(photo.tusky_id)}
                        >
                          {/* <Image
                            // src={`${AGGREGATOR_URL}/v1/blobs/${photo.blob_id}`}
                            src={photo?.blob_id && photo?.blob_id !== 'unknown' ? `${AGGREGATOR_URL}/v1/blobs/${photo?.blob_id}` : `https://cdn.tusky.io/${photo?.tusky_id}`}
                            alt={`Photo ${photo.blob_id}`}
                            className='rounded-md transition-all duration-300 object-contain'
                            fill
                            sizes='(max-width: 768px) 40vw, 25vw'
                            style={{ transform: 'translateZ(0)' }}
                          /> */}
                          <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full h-40 mb-4">
                            {Array.from({ length: 4 }).map((_, idx) => (
                              <div key={idx} className="relative w-full aspect-[4/3] bg-gray-100 rounded overflow-hidden">
                                <Image
                                  src={photoUrl}
                                  alt={`Photo segment ${idx + 1}`}
                                  fill
                                  className="object-cover rounded"
                                  style={{
                                    objectPosition:
                                      idx === 1
                                        ? '0% 33%'
                                        : idx === 2
                                          ? '0% 66%'
                                          : idx === 3
                                            ? '0% 99%'
                                            : '0% 0%',
                                    transform: 'scale(1.1)',
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          <div className='absolute inset-0 flex items-center justify-center'>
                            <span className='opacity-0 group-hover:opacity-100 text-white text-sm bg-black px-3 py-1 rounded-full transition-opacity'>
                              View
                            </span>
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent
                        className='max-w-[420px] w-full p-0 bg-black/90 border-none rounded-xl overflow-hidden flex flex-col items-center'
                        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.35)', maxHeight: '100vh' }}
                      >
                        {/* Header */}
                        <div className="w-full flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/90">
                          <span className="text-lg font-semibold text-white">Your Photo Strip</span>
                          <DialogClose
                            className='text-white text-2xl font-bold hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition'
                            aria-label='Close dialog'
                          >
                            ×
                          </DialogClose>
                        </div>
                        {/* Photo */}
                        <div className="w-full flex items-center justify-center py-6 px-4 bg-black">
                          <div className="relative w-full" style={{ aspectRatio: '1/2.2', maxWidth: 320, height: '70vh' }}>
                            <Image
                              src={photo?.blob_id && photo?.blob_id !== 'unknown' ? `${AGGREGATOR_URL}/v1/blobs/${photo?.blob_id}` : `https://cdn.tusky.io/${photo?.tusky_id}`}
                              alt={`Photo ${photo.blob_id}`}
                              className='rounded-lg object-contain bg-white'
                              fill
                              sizes='320px'
                              priority
                              style={{ objectFit: 'contain' }}
                            />
                          </div>
                        </div>
                        {/* Download Button */}
                        <div className="w-full px-0 pb-0" style={{ background: '#232323', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                          <a
                            href={photo?.blob_id && photo?.blob_id !== 'unknown' ? `${AGGREGATOR_URL}/v1/blobs/${photo?.blob_id}` : `https://cdn.tusky.io/${photo?.tusky_id}`}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-white text-lg font-semibold tracking-wide text-center py-4"
                            style={{ letterSpacing: 2 }}
                          >
                            DOWNLOAD
                          </a>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {isConnected && eventDetails?.admin_id === currentAdminId && (
                      <div className='mt-3 w-full z-10'>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button className='w-full bg-red-600/90 hover:bg-red-700 text-white transition-colors text-sm'>
                              <TrashIcon className='mr-2 h-3 w-3' />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className='bg-white dark:bg-gray-800'>
                            <AlertDialogHeader>
                              <AlertDialogTitle className='text-gray-900 dark:text-white'>
                                Are you sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription className='text-gray-600 dark:text-gray-400'>
                                Delete photo {photo.tusky_id}? This action cannot
                                be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className='bg-gray-100 hover:bg-gray-200 text-gray-900'>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeletePhoto(photo.tusky_id)}
                                className='bg-red-600 hover:bg-red-700 text-white'
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default EventPage;
