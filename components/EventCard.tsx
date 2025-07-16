import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { TrashIcon, DownloadIcon } from '@radix-ui/react-icons';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import JSZip from 'jszip';

interface Event {
  id: number;
  created_at: string;
  event_title: string;
  admin_id: number;
  event_date: string;
  event_slug: string;
  photo_url?: string;
}

interface EventCardProps {
  event: Event;
  isConnected: boolean;
  currentAdminId: number | null;
  onDelete: (id: number) => void;
  onDeletePhoto?: (photoId: number, userEmail: string) => Promise<void>;
  isSuperAdmin: boolean; 
  onExport?: (eventId: number) => void;
}

export const EventCard = ({
  event,
  isConnected,
  currentAdminId,
  onDelete,
  isSuperAdmin,
  onExport,
}: EventCardProps) => {
  const [randomPhoto, setRandomPhoto] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchRandomPhoto = async () => {
      const { data, error } = await supabase
        .from('photos')
        .select('blob_id, tusky_id')
        .eq('event_id', event.id);

      if (error) {
        console.error('Error fetching photos:', error);
        return;
      }

      if (data && data.length > 0) {
        // Get 1 random photo
        const randomIndex = Math.floor(Math.random() * data.length);
        const selectedPhoto = data[randomIndex];

        let photoUrl = null;
        if (selectedPhoto.blob_id) {
          photoUrl = supabase.storage.from('photos-bucket').getPublicUrl(selectedPhoto.blob_id).data.publicUrl;
        } else if (selectedPhoto.tusky_id) {
          photoUrl = `https://cdn.tusky.io/${selectedPhoto.tusky_id}`;
        }

        setRandomPhoto(photoUrl);
      }
    };

    fetchRandomPhoto();
  }, [event.id]);

  // Format date similar to image
  const formattedDate = new Date(event.event_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      console.log('Fetching photos for event:', event.id);
      
      const { data: photos, error } = await supabase
        .from('photos')
        .select('blob_id, tusky_id')
        .eq('event_id', event.id);

      if (error) {
        console.error('Error fetching photos for export:', error);
        alert(`Error fetching photos: ${error.message}`);
        return;
      }

      console.log('Photos found:', photos?.length || 0);

      if (!photos || photos.length === 0) {
        alert('No photos found for this event');
        return;
      }

      const zip = new JSZip();
      let successCount = 0;
      
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        let photoUrl = null;
        
        if (photo.blob_id) {
          photoUrl = supabase.storage.from('photos-bucket').getPublicUrl(photo.blob_id).data.publicUrl;
        } else if (photo.tusky_id) {
          photoUrl = `https://cdn.tusky.io/${photo.tusky_id}`;
        }

        if (photoUrl) {
          try {
            console.log(`Downloading photo ${i + 1}/${photos.length}`);
            const response = await fetch(photoUrl);
            
            if (!response.ok) {
              console.error(`Failed to fetch photo ${i + 1}: ${response.status}`);
              continue;
            }
            
            const blob = await response.blob();
            const fileName = `photo_${String(i + 1).padStart(3, '0')}.jpg`;
            zip.file(fileName, blob);
            successCount++;
          } catch (err) {
            console.error(`Error downloading photo ${i + 1}:`, err);
          }
        }
      }

      if (successCount === 0) {
        alert('Failed to download any photos');
        return;
      }

      console.log(`Successfully added ${successCount} photos to zip`);
      
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${event.event_slug}_photos.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // alert(`Successfully exported ${successCount} photos`);
      
      if (onExport) {
        onExport(event.id);
      }
    } catch (error) {
      console.error('Error exporting photos:', error);
      alert('Failed to export photos. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Link href={`/events/${event.event_slug}`} className="block" passHref legacyBehavior>
      <div
        className="bg-white rounded-xl border border-[#F2F2F2] p-6 max-w-xl w-full mx-auto hover:shadow-md transition-shadow cursor-pointer"
        onClick={(e) => {
          // Prevent navigation if a button or its child is clicked
          const target = e.target as HTMLElement;
          if (
            target.closest('button') ||
            target.closest('[role="button"]')
          ) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <div className="grid grid-cols-2 grid-rows-2 gap-4 mb-6">
          {randomPhoto
            ? Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="relative w-full aspect-[4/3] bg-gray-100 rounded overflow-hidden">
                  <Image
                  src={randomPhoto}
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
              ))
            : Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="relative w-full aspect-[4/3] bg-gray-100 rounded">
                  <Image
                    src="/brand-image-walrus.png"
                    alt="Default Event"
                    fill
                    className="object-cover opacity-40"
                  />
                </div>
              ))}
        </div>
        <div className="mb-2 text-gray-400 text-sm">{formattedDate}</div>
        <div className="mb-6 text-xl font-semibold tracking-wide">{event.event_title.toUpperCase()}</div>
        {isConnected && (isSuperAdmin || currentAdminId === event.admin_id) && (
          <div className="flex gap-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 font-medium py-3 px-0 rounded transition-colors flex items-center justify-center gap-2"
                >
                  DELETE
                  <TrashIcon className="h-5 w-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    event and all associated photos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(event.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              variant="outline"
              size="lg"
              className="flex-1 border border-gray-200 text-black hover:bg-gray-50 font-medium py-3 px-0 rounded transition-colors flex items-center justify-center gap-2"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? 'EXPORTING...' : 'EXPORT'}
              <DownloadIcon className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </Link>
  );
};