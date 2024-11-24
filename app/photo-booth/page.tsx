'use client';

import { useState, useEffect } from 'react';
import { useCustomWallet } from '@/contexts/CustomWallet';
import { createClient } from '@supabase/supabase-js';
import PhotoBooth from '@/components/PhotoBooth';
import Loading from '@/components/Loading';
import ProfilePopover from '@/components/ProfilePopover';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

interface Event {
  id: number;
  created_at: string;
  event_title: string;
  admin_id: number;
}

const PhotoBoothPage: React.FC = () => {
  const { isConnected, emailAddress } = useCustomWallet();
  const [isLoading, setIsLoading] = useState(true);
  const [currentAdminId, setCurrentAdminId] = useState<number | null>(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCurrentAdmin = async () => {
      setIsLoading(true);

      const { data: admins, error } = await supabase
        .from('admins')
        .select('id')
        .eq('email', emailAddress);

      if (error) {
        setError(error);
        console.error('Error fetching admin info:', error);
      } else {
        if (admins[0]) setCurrentAdminId(admins[0].id);
      }

      setIsLoading(false);
    };

    fetchCurrentAdmin();
  }, [emailAddress]);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);

      if (currentAdminId) {
        const { data: events, error } = await supabase
          .from('events')
          .select('*')
          .eq('admin_id', currentAdminId);

        if (error) {
          setError(error);
          console.error('Error fetching events:', error);
        } else {
          setEvents((events as Event[]) || []);
        }
      }

      setIsLoading(false);
    };

    fetchEvents();
  }, [currentAdminId]);

  const handleSelect = (e) => {
    setCurrentEvent(e);
  };

  if (error) {
    return <div>Error loading events</div>;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!isConnected) {
    return (
      <main className='container mx-auto'>
        <div className='min-h-screen w-full flex items-center justify-center p-4 relative'>
          <ProfilePopover />
        </div>
      </main>
    );
  }

  return (
    <main className='container min-h-screen mx-auto px-4 py-8 flex flex-col'>
      <div className='w-full flex items-center justify-center grow-0 p-4'>
        <ProfilePopover />
      </div>
      <div className='w-full flex items-center justify-center grow p-4'>
        {currentEvent ? (
          <PhotoBooth currentEvent={currentEvent} />
        ) : (
          <Select onValueChange={handleSelect}>
            <SelectTrigger className='w-[200px]'>
              <SelectValue placeholder='Select an Event' />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {events &&
                  events.map((el: Event, index) => (
                    <SelectItem key={index} value={el.id.toString()}>
                      {el.event_title}
                    </SelectItem>
                  ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      </div>
    </main>
  );
};

export default PhotoBoothPage;
