'use client';

import { useState, useEffect } from 'react';
import { useCustomWallet } from '@/contexts/CustomWallet';
import { createClient } from '@supabase/supabase-js';
import ProfilePopover from '@/components/ProfilePopover';
import { TrashIcon } from '@radix-ui/react-icons';
import Loading from '@/components/Loading';
import Link from 'next/link';

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
import { Button } from '@/components/ui/button';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

interface Event {
  id: number;
  created_at: string;
  event_title: string;
  admin_id: number;
  event_date: string;
}

const HomePage: React.FC = () => {
  const { isConnected, emailAddress } = useCustomWallet();
  const [isLoading, setIsLoading] = useState(true);

  const [currentAdminId, setCurrentAdminId] = useState<number | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);

      const { data: events, error } = await supabase.from('events').select('*');

      if (error) {
        setError(error);
        console.error('Error fetching events:', error);
      } else {
        setEvents((events as Event[]) || []);
      }

      setIsLoading(false);
    };

    fetchEvents();
  }, []);

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

  const handleDeleteEvent = async (id: number) => {
    const { error } = await supabase.from('events').delete().eq('id', id);

    if (error) {
      setError(error);
      console.error('Error fetching events:', error);
    } else {
      setEvents(events.filter((event) => event.id !== id));
    }

    setIsLoading(false);
  };

  if (error) {
    return <div>Error loading events</div>;
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <main className='container mx-auto px-4 py-8'>
      <div className='w-full flex items-center justify-between relative mb-10'>
        <h1 className='text-3xl font-bold'>Photo Booth Events</h1>
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

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {events.length > 0 &&
          events.map((e) => (
            <div
              key={e.id}
              className='w-full rounded-xl text-white bg-black mb-4 p-6 text-center'
            >
              <div className='w-full flex gap-2 items-center justify-center'>
                <a href={`photos/${e.id}`} className='block relative'>
                  {e.event_title.toUpperCase()}
                </a>
                {isConnected && e.admin_id === currentAdminId && (
                  <AlertDialog>
                    <AlertDialogTrigger
                      asChild
                      className='ml-2 cursor-pointer p-2 z-10 bg-gray-800 rounded-sm'
                    >
                      <Button>
                        <TrashIcon className='z-10' />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Delete event &apos;{e.event_title}&apos;? This action
                          cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteEvent(e.id)}
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
    </main>
  );
};

export default HomePage;
