import React, { useEffect, useState } from 'react';
import { EventCard } from './EventCard';
import { supabase } from '@/lib/supabaseClient';

interface Event {
  id: number;
  event_title: string;
  created_at: string;
  admin_id: number;
  event_date: string;
  event_slug: string;
  photo_url?: string;
}

const EventList = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*'); 

      if (error) {
        console.error('Error fetching events:', error);
      } else {
        setEvents(data || []);
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  if (loading) {
    return <p>Loading events...</p>;
  }

  return (
    <div className="event-list">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          isConnected={false}
          currentAdminId={null}
          isSuperAdmin={false} // Add the isSuperAdmin property
          onDelete={(id: number) => {
            console.log(`Delete event with id: ${id}`);
          }}
        />
      ))}
    </div>
  );
};

export default EventList;