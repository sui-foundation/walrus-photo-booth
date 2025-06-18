'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthentication } from '@/contexts/Authentication';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, ArrowLeft, Calendar, User as UserIcon, MoreVertical } from 'lucide-react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import UnifiedHeader from '@/components/UnifiedHeader';
import { useToast } from "@/hooks/use-toast";
import JSZip from 'jszip';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const ManageUsersPage = () => {
  const { user } = useAuthentication();
  const router = useRouter();
  const [admins, setAdmins] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showMenuIdx, setShowMenuIdx] = useState<number | null>(null);
  const [showLogoPopover, setShowLogoPopover] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [addUserEmail, setAddUserEmail] = useState('');
  const [addUserRole, setAddUserRole] = useState('admin');
  const [addUserError, setAddUserError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ email: string, type: 'user' | 'events' | null }>({ email: '', type: null });
  const [showTab, setShowTab] = useState<'users' | 'events'>('users');
  const logoPopoverRef = useRef<HTMLDivElement>(null);
  const emailAddress = user?.email || '';
  const adminRole = user?.role || 'admin';
  const isConnected = true;
  const { toast } = useToast();

  useEffect(() => {
    const fetchAdmins = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('admins').select('*');
      if (!error) {
        setAdmins(data.map(a => ({ ...a, showMenu: false })));
      } else {
        console.error('Error fetching admins:', error);
      }
      setIsLoading(false);
    };
    fetchAdmins();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      // Lấy event và đếm số lượng ảnh cho mỗi event
      const { data: eventsData, error: eventsError } = await supabase.from('events').select('*');
      if (!eventsError && eventsData) {
        // Lấy danh sách event ids
        const eventIds = eventsData.map(e => e.id);
        // Lấy số lượng ảnh cho từng event
        const { data: photosData, error: photosError } = await supabase
          .from('photos')
          .select('event_id', { count: 'exact', head: false });
        let photoCountMap: Record<string, number> = {};
        if (!photosError && photosData) {
          // Đếm số lượng ảnh theo event_id
          photosData.forEach(photo => {
            if (photo.event_id) {
              photoCountMap[photo.event_id] = (photoCountMap[photo.event_id] || 0) + 1;
            }
          });
        }
        setEvents(
          eventsData.map(e => ({
            ...e,
            image_count: photoCountMap[e.id] || 0,
            showMenu: false,
          }))
        );
      } else {
        console.error('Error fetching events:', eventsError);
      }
      setIsLoading(false);
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        logoPopoverRef.current &&
        !logoPopoverRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('img')
      ) {
        setShowLogoPopover(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDelete = async (email: string) => {
    console.log('Deleting user:', email);
    const { error } = await supabase.from('admins').delete().eq('email', email);
    if (!error) {
      setAdmins(prev => prev.filter(a => a.email !== email));
      toast({
        title: 'User deleted',
        description: `User ${email} has been deleted successfully.`,
        variant: 'default',
      });
    } else {
      toast({
        title: 'Delete failed',
        description: error.message || 'Failed to delete user.',
        variant: 'destructive',
      });
      console.error('Error deleting user:', error);
    }
  };

  const handleDeleteEvents = async (email: string) => {
    const { data: admin } = await supabase.from('admins').select('id').eq('email', email).single();
    if (admin) {
      await supabase.from('events').delete().eq('admin_id', admin.id);
    }
  };

  // Xử lý xóa event
  const handleDeleteEvent = async (eventId: string) => {
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (!error) {
      setEvents(prev => prev.filter(e => e.id !== eventId));
      toast({
        title: 'Event deleted',
        description: 'The event has been deleted successfully.',
        variant: 'default',
      });
    } else {
      toast({
        title: 'Delete failed',
        description: error.message || 'Failed to delete event.',
        variant: 'destructive',
      });
      console.error('Error deleting event:', error);
    }
  };

  // Xử lý xóa ảnh của event
  const handleDeleteEventImages = async (eventId: string) => {
    const { error } = await supabase.from('photos').delete().eq('event_id', eventId);
    if (!error) {
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, image_count: 0 } : e));
      toast({
        title: 'Images deleted',
        description: 'All images for this event have been deleted.',
        variant: 'default',
      });
    } else {
      toast({
        title: 'Delete failed',
        description: error.message || 'Failed to delete images.',
        variant: 'destructive',
      });
      console.error('Error deleting images:', error);
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredEvents = events.filter(event =>
    event.event_title.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddUser = async () => {
    setAddUserError('');
    if (!addUserEmail) {
      setAddUserError('Email is required');
      return;
    }
    // Add user logic (call API or supabase)
    const { error } = await supabase.from('admins').insert([{ email: addUserEmail, role: addUserRole }]);
    if (error) {
      setAddUserError('Failed to add user');
    } else {
      setAdmins(prev => [...prev, { email: addUserEmail, role: addUserRole, showMenu: false }]);
      setShowAddUser(false);
      setAddUserEmail('');
      setAddUserRole('admin');
    }
  };

  // Thêm hàm export images cho event
  const handleExportEventImages = async (event: any) => {
    try {
      toast({ title: 'Exporting...', description: 'Preparing images for download', variant: 'default' });
      // Lấy danh sách photos của event
      const { data: photos, error } = await supabase
        .from('photos')
        .select('blob_id, tusky_id')
        .eq('event_id', event.id);
      if (error) {
        toast({ title: 'Export failed', description: error.message, variant: 'destructive' });
        return;
      }
      if (!photos || photos.length === 0) {
        toast({ title: 'No photos', description: 'No photos found for this event.', variant: 'destructive' });
        return;
      }
      const zip = new JSZip();
      let successCount = 0;
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        let photoUrl = null;
        if (photo.blob_id) {
          // Nếu dùng Supabase Storage
          photoUrl = supabase.storage.from('photos-bucket').getPublicUrl(photo.blob_id).data.publicUrl;
        } else if (photo.tusky_id) {
          photoUrl = `https://cdn.tusky.io/${photo.tusky_id}`;
        }
        if (photoUrl) {
          try {
            const response = await fetch(photoUrl);
            if (!response.ok) continue;
            const blob = await response.blob();
            const fileName = `photo_${String(i + 1).padStart(3, '0')}_${photo.user_email || 'unknown'}.jpg`;
            zip.file(fileName, blob);
            successCount++;
          } catch (err) {
            // Bỏ qua ảnh lỗi
          }
        }
      }
      if (successCount === 0) {
        toast({ title: 'Export failed', description: 'No downloadable photos found.', variant: 'destructive' });
        return;
      }
      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${event.event_title || 'event'}_photos.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'Exported', description: `Successfully exported ${successCount} photos.`, variant: 'default' });
    } catch (err) {
      toast({ title: 'Export failed', description: 'Failed to export photos. Please try again.', variant: 'destructive' });
    }
  };

  if (isLoading) return <Loading />;

  return (
    <main className="min-h-screen bg-white text-black pb-6">
      <UnifiedHeader variant="main" enableMenuFunctionality={true} />

      {/* Tabs */}
      <div className="flex w-full border-b border-gray-200 bg-white" style={{ height: 48 }}>
        <button
          className={`flex-1 text-center py-3 font-semibold ${showTab === 'users' ? 'text-black border-b-2 border-black bg-white' : 'text-gray-400 bg-gray-100'}`}
          onClick={() => setShowTab('users')}
        >
          Manage Users
        </button>
        <button
          className={`flex-1 text-center py-3 font-semibold ${showTab === 'events' ? 'text-black border-b-2 border-black bg-white' : 'text-gray-400 bg-gray-100'}`}
          onClick={() => setShowTab('events')}
        >
          Manage Events
        </button>
      </div>

      {/* Tab content */}
      {showTab === 'users' && (
        <>
          {/* Search bar */}
          <div className="px-4 py-4 bg-white">
            <input
              type="text"
              placeholder="Search user"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-base mb-2"
            />
          </div>

          {/* User List */}
          <div className="px-0">
            <div className="divide-y">
              {filteredAdmins.map((admin, idx) => (
                <div key={admin.email} className="flex items-center justify-between px-6 py-4 bg-white hover:bg-gray-50 group relative">
                  <div className="flex items-center gap-4">
                    <img
                      src={admin.avatar_url || '/walrus.jpg'}
                      alt="avatar"
                      className="w-10 h-10 rounded-full border"
                    />
                    <div>
                      <div className="font-medium text-base">{admin.email}</div>
                      <div className="text-xs text-gray-500">{admin.role === 'super admin' ? 'Super Admin' : admin.role === 'admin' ? 'Admin' : admin.role}</div>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setShowMenuIdx(idx === showMenuIdx ? null : idx)}
                      className="p-2 rounded-full hover:bg-gray-100"
                    >
                      <MoreVertical className="w-6 h-6 text-gray-600" />
                    </button>
                    {showMenuIdx === idx && (
                      <div className="absolute right-0 mt-2 bg-white border shadow-xl rounded-md w-64 z-20 animate-fade-in overflow-hidden">
                        <button
                          className="flex w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 items-center gap-2 border-b border-gray-100 font-semibold"
                          onClick={async (event) => {
                            event.stopPropagation();
                            await handleDeleteEvents(admin.email);
                            setShowMenuIdx(null);
                            toast({
                              title: "Events deleted",
                              description: `All events for ${admin.email} have been deleted.`,
                              variant: "default",
                            });
                          }}
                        >
                          <Calendar className="w-4 h-4 text-red-500" />
                          DELETE USER'S EVENTS
                        </button>
                        <button
                          className="flex w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 items-center gap-2 font-semibold"
                          onClick={async (event) => {
                            event.stopPropagation();
                            await handleDelete(admin.email);
                            setShowMenuIdx(null);
                          }}
                        >
                          <UserIcon className="w-4 h-4 text-red-500" />
                          DELETE USER
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      {showTab === 'events' && (
        <>
          {/* Search bar */}
          <div className="px-4 py-4 bg-white">
            <input
              type="text"
              placeholder="Search event"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-base mb-2"
            />
          </div>
          {/* Event List */}
          <div className="px-0 pb-40">
            <div className="divide-y">
              {events && filteredEvents.map((event, idx) => (
                <div key={event.id} className="flex items-center justify-between px-6 py-4 bg-white hover:bg-gray-50 group relative">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full border bg-gray-200 flex items-center justify-center font-bold text-lg text-gray-500">
                      {event.event_title?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="font-medium text-base">{event.event_title}</div>
                      <div className="text-xs text-gray-500">{event.owner_email}</div>
                      <div className="text-xs text-gray-400">{event.event_date ? new Date(event.event_date).toLocaleDateString() : ''} • {event.image_count || 0} photos</div>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setShowMenuIdx(idx === showMenuIdx ? null : idx)}
                      className="p-2 rounded-full hover:bg-gray-100"
                    >
                      <MoreVertical className="w-6 h-6 text-gray-600" />
                    </button>
                    {showMenuIdx === idx && (
                      <div className="absolute right-0 mt-2 bg-white border shadow-xl rounded-md w-64 z-20 animate-fade-in overflow-hidden">
                        <button
                          className="flex w-full px-4 py-3 text-sm hover:bg-gray-100 items-center gap-2 border-b border-gray-100 font-semibold"
                          onClick={async () => {
                            await handleExportEventImages(event);
                            setShowMenuIdx(null);
                          }}
                        >
                          <span className="text-blue-500">⬇</span> EXPORT IMAGES
                        </button>
                        <button
                          className="flex w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 items-center gap-2 border-b border-gray-100 font-semibold"
                          onClick={async () => {
                            await handleDeleteEventImages(event.id);
                            setShowMenuIdx(null);
                          }}
                        >
                          <span className="text-red-500">🖼</span> DELETE EVENT’S IMAGES
                        </button>
                        <button
                          className="flex w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 items-center gap-2 font-semibold"
                          onClick={async () => {
                            await handleDeleteEvent(event.id);
                            setShowMenuIdx(null);
                          }}
                        >
                          <span className="text-red-600">🗑</span> DELETE EVENT
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-0 z-30">
            <button
              onClick={() => router.push('/addEvent')}
              className="w-full bg-teal-200 text-black font-semibold uppercase py-4 text-lg tracking-wider hover:bg-teal-300 transition rounded-none"
            >
              CREATE NEW EVENT
            </button>
          </div>
        </>
      )}

      {/* Add New User Button + Dialog */}
      {showTab === 'users' && (
        <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
          <DialogTrigger asChild>
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-0">
              <button
                className="w-full bg-teal-200 text-black font-semibold uppercase py-4 text-lg tracking-wider hover:bg-teal-300 transition rounded-none"
              >
                ADD NEW USER
              </button>
            </div>
          </DialogTrigger>
          <DialogContent className="bg-black text-white max-w-sm w-full p-6 rounded-lg shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Add New User</DialogTitle>
              <DialogDescription className="text-sm text-gray-400">
                Enter the email address of the new user you want to add.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <Input
                type="email"
                placeholder="User email"
                value={addUserEmail}
                onChange={(e) => setAddUserEmail(e.target.value)}
                className="w-full p-3 text-base rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div className="mt-4">
              <Select value={addUserRole} onValueChange={setAddUserRole}>
                <SelectTrigger className="w-full p-3 text-base rounded-lg bg-gray-800 border border-gray-700">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border border-gray-700 rounded-lg">
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {addUserError && <div className="mt-4 text-sm text-red-500">{addUserError}</div>}
            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAddUser(false)}
                className="w-full py-3 text-base rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 transition"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                className="w-full py-3 text-base rounded-lg bg-teal-600 hover:bg-teal-500 transition"
              >
                Add User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
};

export default ManageUsersPage;
