'use client';

import { useState, useEffect } from 'react';
import { useAuthentication } from '@/contexts/Authentication';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';
import { format } from 'date-fns';
import UnifiedHeader from '@/components/UnifiedHeader';

const ManageEventsPage = () => {
  const { user } = useAuthentication();
  const router = useRouter();
  const [events, setEvents] = useState<Array<{ id: string; event_title: string; event_slug: string; event_date: string; showMenu: boolean; image_count?: number; owner_email?: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });
      if (!error) {
        setEvents(data.map(e => ({ ...e, showMenu: false })));
      } else {
        console.error('Error fetching events:', error);
      }
      setIsLoading(false);
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isMenuClick = (target as Element).closest('.menu-button');

      if (!isMenuClick) {
        setEvents(prev => prev.map(e => ({ ...e, showMenu: false })));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteEvent = async (id: string, ownerEmail: string) => {
    if (!isSuperAdmin && user?.email !== ownerEmail) {
      alert('You do not have permission to delete this event.');
      return;
    }
    if (!confirm('Delete this event?')) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (!error) setEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleDeleteImages = async (eventId: string) => {
    if (!confirm('Delete images for this event?')) return;
    console.log('Deleting images for event', eventId);
    // Implement image deletion logic
  };

  const filteredEvents = events.filter(e => e.event_title?.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) return <Loading />;

  return (
    <main className="min-h-screen bg-white text-black pb-6">
      <UnifiedHeader variant="main" enableMenuFunctionality={true} />

      {/* Tabs */}
      <div className="pt-4 px-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => router.push('/manage/users')}
            className="px-4 py-2 bg-gray-200 rounded-md text-sm hover:bg-gray-300"
          >
            Manage Users
          </button>
          <button
            className="px-4 py-2 bg-black text-white rounded-md text-sm"
          >
            Manage Events
          </button>
        </div>

        <input
          type="text"
          placeholder="Search event"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
        />

        <div className="space-y-4">
          {filteredEvents.map((event, idx) => (
            <div key={event.id} className="border rounded-lg p-4 shadow relative">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold text-lg">{event.event_title}</div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(event.event_date || Date.now()), 'MMMM d, yyyy')} • {event.image_count || 0} photos
                  </div>
                  <div className="text-sm text-gray-400">{event.owner_email}</div>
                </div>
                <div className="relative">
                  <button
                    onClick={() =>
                      setEvents(prev =>
                        prev.map((e, i) => ({
                          ...e,
                          showMenu: i === idx ? !e.showMenu : false,
                        }))
                    )}
                    className="p-2 menu-button"
                  >
                    ⋮
                  </button>
                  {event.showMenu && (
                    <div className="absolute right-0 mt-2 bg-white border shadow-md rounded-md w-48 z-10">
                      <button
                        className="flex w-full px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => {
                          console.log('Exporting images...');
                          setEvents(prev => prev.map(e => ({ ...e, showMenu: false })));
                        }}
                      >
                        ⬇ EXPORT IMAGES
                      </button>
                      <button
                        className="flex w-full px-4 py-2 text-sm text-red-500 hover:bg-red-100"
                        onClick={() => {
                          handleDeleteImages(event.id);
                          setEvents(prev => prev.map(e => ({ ...e, showMenu: false })));
                        }}
                      >
                        🖼 DELETE EVENT’S IMAGES
                      </button>
                      <button
                        className="flex w-full px-4 py-2 text-sm text-red-600 hover:bg-red-100"
                        onClick={() => {
                          handleDeleteEvent(event.id, event.owner_email || '');
                          setEvents(prev => prev.map(e => ({ ...e, showMenu: false })));
                        }}
                        disabled={!isSuperAdmin && user?.email !== event.owner_email}
                      >
                        🗑 DELETE EVENT
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => router.push('/addEvent')}
          className="w-full mt-6 py-3 bg-teal-500 text-white rounded-md font-semibold hover:bg-teal-600"
        >
          CREATE NEW EVENT
        </button>
      </div>
    </main>
  );
};

export default ManageEventsPage;
