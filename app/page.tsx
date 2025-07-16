'use client';

import { useState, useEffect } from 'react';
import { useCustomWallet } from '@/contexts/CustomWallet';
import { supabase } from '@/lib/supabaseClient';
import ProfilePopover from '@/components/ProfilePopover';
import Loading from '@/components/Loading';
import Link from 'next/link';
import { EventCard } from '@/components/EventCard';
import UnifiedHeader from '@/components/UnifiedHeader';

interface Event {
  id: number;
  created_at: string;
  event_title: string;
  event_slug: string;
  admin_id: number;
  event_date: string;
}

const HomePage: React.FC = () => {
  const { isConnected, emailAddress } = useCustomWallet();

  const [isLoading, setIsLoading] = useState(true);
  const [currentAdminId, setCurrentAdminId] = useState<number | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [adminRole, setAdminRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);

      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });

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
        console.error('Error fetching current admin:', error);
      } else {
        if (admins.length > 0) setCurrentAdminId(admins[0].id);
      }

      setIsLoading(false);
    };

    fetchCurrentAdmin();
  }, [emailAddress]);

  useEffect(() => {
    const fetchAdminRole = async () => {
      if (!emailAddress) return;
      const { data, error } = await supabase
        .from('admins')
        .select('role')
        .eq('email', emailAddress)
        .single();
      if (!error && data?.role) {
        setAdminRole(data.role);
      } else {
        setAdminRole(null);
      }
    };

    fetchAdminRole();
  }, [emailAddress]);

  const handleDeleteEvent = async (id: number) => {
    setIsLoading(true);

    try {
      // delete all photos associated with the event
      const { error: photosError } = await supabase
        .from('photos')
        .delete()
        .eq('event_id', id);

      if (photosError) throw photosError;

      // delete the event
      const { error: eventError } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (eventError) throw eventError;

      setEvents(events.filter((event) => event.id !== id));
    } catch (error) {
      console.error('Error deleting event:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return <div>Error loading events</div>;
  }

  if (isLoading) {
    return <Loading />;
  }

  // Pass isSuperAdmin to EventCard
  return (
    <main className="min-h-screen bg-white text-black pb-6">
      <UnifiedHeader variant="main" enableMenuFunctionality={true} />
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto pt-[20px] px-4'>
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            isConnected={isConnected}
            currentAdminId={currentAdminId}
            onDelete={handleDeleteEvent}
            isSuperAdmin={adminRole === 'super_admin'}
          />
        ))}
      </div>
    </main>
  );
};

export default HomePage;
