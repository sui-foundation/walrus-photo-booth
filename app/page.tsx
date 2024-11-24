'use client';

import { useState, useEffect } from 'react';
import { useCustomWallet } from '@/contexts/CustomWallet';
import { createClient } from '@supabase/supabase-js';
import ProfilePopover from '@/components/ProfilePopover';
import { TrashIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import Loading from '@/components/Loading';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

interface Event {
  id: number;
  created_at: string;
  event_title: string;
  admin_id: number;
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

    setIsLoading(true);
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
              <a
                href='/addEvent'
                className='flex items-center justify-center rounded-md text-sm text-white bg-gray-500 py-2 px-6'
              >
                + Event
              </a>
              <a
                href='/photo-booth'
                className='flex items-center justify-center rounded-md text-sm text-black bg-gray-300 py-2 px-6'
              >
                Booth
              </a>
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
              className='w-full rounded-md text-white bg-black py-6 px-6 mb-4 text-center'
            >
              <a href={`photos/${e.id}`}>{e.event_title.toUpperCase()}</a>

              {isConnected && e.admin_id === currentAdminId && (
                <Button
                  onClick={() => handleDeleteEvent(e.id)}
                  className='cursor-pointer'
                >
                  <TrashIcon />
                </Button>
              )}
            </div>
          ))}
      </div>
    </main>
  );
};

export default HomePage;
