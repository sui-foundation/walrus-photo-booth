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
import { TrashIcon } from '@radix-ui/react-icons';
import Image from 'next/image';

interface Event {
  id: number;
  created_at: string;
  event_title: string;
  admin_id: number;
  event_date: string;
  photo_url?: string;
}

interface EventCardProps {
  event: Event;
  isConnected: boolean;
  currentAdminId: number | null;
  onDelete: (id: number) => void;
}

function convertFromHtmlEntities(str: string): string {
  return str
    .replace(/&nbsp;/g, ' ')
    .replace(/&#38;/g, '&')
    .replace(/&#35;/g, '#')
    .replace(/&#33;/g, '!')
    .replace(/&#34;/g, '"')
    .replace(/&#36;/g, '$')
    .replace(/&#39;/g, "'")
    .replace(/&#40;/g, '(')
    .replace(/&#41;/g, ')')
    .replace(/&#44;/g, ',')
    .replace(/&#45;/g, '-')
    .replace(/&#46;/g, '.')
    .replace(/&#47;/g, '/')
    .replace(/&#58;/g, ':')
    .replace(/&#64;/g, '@')
    .replace(/&#95;/g, '_');
}

export const EventCard = ({
  event,
  isConnected,
  currentAdminId,
  onDelete,
}: EventCardProps) => {
  const eventTitle = convertFromHtmlEntities(event.event_title);

  return (
    <div className='rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-xl'>
      <Link href={`/photos/${eventTitle}`} className='block'>
        <div className='relative aspect-[16/9] overflow-hidden rounded-t-lg'>
          <Image
            src={event.photo_url || '/brand-image-walrus.png'}
            alt={event.event_title}
            fill
            className='object-cover'
          />
        </div>
        <div className='p-6'>
          <h2 className='text-xl font-semibold mb-2'>
            {eventTitle.toUpperCase()}
          </h2>
          <p className='text-gray-600 mb-2'>
            {new Date(event.event_date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      </Link>
      {isConnected && event.admin_id === currentAdminId && (
        <div className='px-6 pb-4'>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant='destructive' size='sm'>
                <TrashIcon className='mr-2 h-4 w-4' />
                Delete Event
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
        </div>
      )}
    </div>
  );
};
