'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { createClient } from '@supabase/supabase-js';

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
  // const resolvedParams = use(params);
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data: events, error } = await supabase.from('events').select('*');

      if (error) {
        setError(error);
        console.error('Error fetching events:', error);
      } else {
        console.log(events);
        setEvents((events as Event[]) || []);
      }
    };

    fetchEvents();
  }, []);

  if (error) {
    return <div>Error loading photos</div>;
  }

  return (
    <main className='container mx-auto px-4 py-8'>
      <div className='w-full flex items-center justify-between relative'>
        <h1 className='text-3xl font-bold mb-8'>Photo Booth Events</h1>
        <Button className='mb-4'>Login</Button>
      </div>

      <div className='w-80 m-auto flex flex-col items-center justify-center p-8 relative'>
        {events.length > 0 &&
          events.map((e) => (
            <a
              href={`photos/${e.id}`}
              key={e.id}
              className='w-full rounded-md text-white bg-black py-3 px-6 mb-4 text-center'
            >
              Event {e.id}
            </a>
          ))}

        <a
          href='#'
          className='w-full rounded-md text-white bg-gray-700 py-3 px-6 mb-4 text-center'
        >
          Create Event
        </a>
      </div>
    </main>
  );
};

export default HomePage;
