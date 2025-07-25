'use client';

import { useState, useEffect, useRef } from 'react';
import { useCustomWallet } from '@/contexts/CustomWallet';
import { supabase } from '@/lib/supabaseClient';
import PhotoBooth from '@/components/PhotoBooth';
import Loading from '@/components/Loading';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

interface Event {
  id: number;
  created_at: string;
  event_title: string;
  event_slug: string;
  event_date: string;
  admin_id: number;
}

const PhotoBoothPage: React.FC = () => {
  const { isConnected, emailAddress } = useCustomWallet();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentAdminId, setCurrentAdminId] = useState<number | null>(null);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [currAdminsEvents, setCurrAdminsEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventSelectedModal, setShowEventSelectedModal] = useState(false);
  const photoBoothRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCurrentAdmin = async () => {
      setIsLoading(true);
      const { data: admins, error } = await supabase
        .from('admins')
        .select('id, role')
        .eq('email', emailAddress)
        .single();
      if (error) {
        setError(error);
        console.error('Error fetching admin info:', error);
      } else {
        if (admins) {
          setCurrentAdminId(admins.id);
          setAdminRole(admins.role);
        }
      }
      setIsLoading(false);
    };
    if (emailAddress) fetchCurrentAdmin();
  }, [emailAddress]);

  useEffect(() => {
    const fetchAllEvents = async () => {
      setIsLoading(true);
      let query = supabase.from('events').select('*').order('event_date', { ascending: false });
      if (adminRole !== 'super_admin' && currentAdminId) {
        query = query.eq('admin_id', currentAdminId);
      }
      const { data: events, error } = await query;
      if (error) {
        setError(error);
        console.error('Error fetching events:', error);
      } else {
        setCurrAdminsEvents((events as Event[]) || []);
      }
      setIsLoading(false);
    };
    if (adminRole && (adminRole === 'super_admin' || currentAdminId)) fetchAllEvents();
  }, [adminRole, currentAdminId]);

  const handleSelectEvent = (e: string) => {
    const eNum = parseInt(e);
    const foundEvent = currAdminsEvents.filter((e) => e.id === eNum);
    localStorage.setItem('selectedEvent', JSON.stringify(foundEvent[0]));
    setSelectedEvent(foundEvent[0]);
    setShowEventSelectedModal(true); // Show modal after selection
  };

  useEffect(() => {
    if (selectedEvent && !showEventSelectedModal && photoBoothRef.current) {
      photoBoothRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedEvent, showEventSelectedModal]);

  if (error) {
    console.error('Error loading events:', error);
    return <div>Error loading events</div>;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!isConnected && !selectedEvent) {
    return (
      <main className='container mx-auto'>
        <div className='min-h-screen w-full flex items-center justify-center p-4 relative'>
        </div>
      </main>
    );
  }

  if (currentAdminId && currAdminsEvents.length === 0) {
    return (
      <main className='container mx-auto'>
        <div className='min-h-screen w-full flex flex-col items-center justify-center p-4 gap-4'>
          <h2 className='text-xl font-neuebit'>No Events Found</h2>
          <p>You haven&apos;t created any events yet.</p>
          <a 
            href="/addEvent" 
            className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
          >
            Create Your First Event
          </a>
        </div>
      </main>
    );
  }

  if (selectedEvent && !showEventSelectedModal) {
    // Hide everything except PhotoBooth
    return (
      <PhotoBooth
        selectedEventTitle={selectedEvent.event_title}
        selectedEventSlug={selectedEvent.event_slug}
        selectedEventId={selectedEvent.id}
        selectedTuskyId={null}
      />
    );
  }

  return (
    <main className="min-h-screen bg-white text-black flex flex-col">
      {/* Header */}
      <div className="w-full bg-black text-white flex flex-col border-b border-white/10">
        <div className="flex items-center px-2 py-2 gap-2">
          <button onClick={() => window.history.back()} className="p-2 rounded hover:bg-white/10 flex items-center">
            <span className="ml-1 text-base">Back</span>
          </button>
          <div className="flex-1 flex justify-center">
            <span className="text-4xl font-neuebit tracking-widest" style={{ letterSpacing: 2 }}>PHOTO BOOTH</span>
          </div>
          <div className="flex items-center gap-3 min-w-[48px]">
            <img src="/on.png" alt="Logo" width={40} height={40} className="rounded-full hover:opacity-80 transition cursor-pointer ml-2" />
          </div>
        </div>
      </div>
      {/* Main content */}
      <div className="flex-1 flex flex-col justify-start items-stretch px-0 pt-6 pb-32 bg-white">
        {error && <p className='text-red-500 font-neuemontreal'>{String(error)}</p>}
        {/* Modal after event selection */}
        {selectedEvent && showEventSelectedModal && (
          <Dialog open={showEventSelectedModal} onOpenChange={setShowEventSelectedModal}>
            <DialogContent className="font-neuemontreal text-black text-center">
              <DialogHeader>
                <DialogTitle className="text-2xl font-neuebit mb-2">Event Selected</DialogTitle>
                <DialogDescription className="font-mono text-lg mb-4">
                  <span className="block font-semibold">{selectedEvent.event_title.toUpperCase()}</span>
                  <span className="block text-base mt-1">{new Date(selectedEvent.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <button
                  className="mt-4 px-6 py-2 bg-black text-white rounded font-mono text-lg hover:bg-gray-800 transition"
                  onClick={() => setShowEventSelectedModal(false)}
                >
                  Continue
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        {/* Main PhotoBooth UI only after modal is closed */}
        {selectedEvent && !showEventSelectedModal ? (
          <div ref={photoBoothRef}>
            <PhotoBooth
              selectedEventTitle={selectedEvent.event_title}
              selectedEventSlug={selectedEvent.event_slug}
              selectedEventId={selectedEvent.id}
              selectedTuskyId={null}
            />
          </div>
        ) : (
          currAdminsEvents.length > 0 && !selectedEvent && (
            <div className="flex flex-col gap-6 mt-4 max-w-lg mx-auto">
              <div className="text-lg font-mono font-semibold text-center">Select an Event</div>
              <Select onValueChange={handleSelectEvent}>
                <SelectTrigger className="w-full bg-white text-black border border-gray-300 rounded font-mono text-lg">
                  <SelectValue placeholder="Select an Event" />
                </SelectTrigger>
                <SelectContent className="bg-white text-black font-mono text-lg">
                  <SelectGroup>
                    {currAdminsEvents.map((el: Event, index) => (
                      <SelectItem
                        key={index}
                        value={el.id.toString()}
                        className="hover:bg-gray-100 font-mono text-lg"
                      >
                        {el.event_title.toUpperCase()} /{' '}
                        {new Date(el.event_date).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          )
        )}
      </div>
      <footer className="w-full py-4 text-center text-sm text-gray-400 font-mono">
        <Link
          href="/terms-of-use"
          className="text-blue-400 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Terms of Use
        </Link>
      </footer>
    </main>
  );
};

export default PhotoBoothPage;
