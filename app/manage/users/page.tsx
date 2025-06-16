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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const ManageAdminsPage = () => {
  const { user } = useAuthentication();
  const router = useRouter();
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showLogoPopover, setShowLogoPopover] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [addUserEmail, setAddUserEmail] = useState('');
  const [addUserRole, setAddUserRole] = useState('admin');
  const [addUserError, setAddUserError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ email: string, type: 'user' | 'events' | null }>({ email: '', type: null });
  const menuRef = useRef<HTMLDivElement | null>(null);
  const logoPopoverRef = useRef<HTMLDivElement>(null);
  const emailAddress = user?.email || '';
  const adminRole = user?.role || 'admin';
  const isConnected = true;

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
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('button')
      ) {
        setShowMenu(false);
      }

      if (
        logoPopoverRef.current &&
        !logoPopoverRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('img')
      ) {
        setShowLogoPopover(false);
      }

      setAdmins(prev =>
        prev.map(admin => ({ ...admin, showMenu: false }))
      );
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDelete = async (email: string) => {
    const { error } = await supabase.from('admins').delete().eq('email', email);
    if (!error) {
      setAdmins(prev => prev.filter(a => a.email !== email));
    }
  };

  const handleDeleteEvents = async (email: string) => {
    const { data: admin } = await supabase.from('admins').select('id').eq('email', email).single();
    if (admin) {
      await supabase.from('events').delete().eq('admin_id', admin.id);
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.email.toLowerCase().includes(search.toLowerCase())
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

  if (isLoading) return <Loading />;

  return (
    <main className="min-h-screen bg-white text-black pb-6">
      <UnifiedHeader variant="main" enableMenuFunctionality={true} />

      {/* Tabs */}
      <div className="flex w-full border-b border-gray-200 bg-white" style={{ height: 48 }}>
        <button className="flex-1 text-center py-3 font-semibold text-black border-b-2 border-black bg-white">Manage Users</button>
        <button className="flex-1 text-center py-3 font-semibold text-gray-400 bg-gray-100 cursor-not-allowed" disabled>Manage Events</button>
      </div>

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
                  <div className="text-xs text-gray-500">Admin</div>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() =>
                    setAdmins(prev =>
                      prev.map((a, i) => ({
                        ...a,
                        showMenu: i === idx ? !a.showMenu : false,
                      }))
                    )
                  }
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <MoreVertical className="w-6 h-6 text-gray-600" />
                </button>
                {admin.showMenu && (
                  <div className="absolute right-0 mt-2 bg-white border shadow-xl rounded-md w-64 z-20 animate-fade-in overflow-hidden">
                    <button
                      className="flex w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 items-center gap-2 border-b border-gray-100 font-semibold"
                      onClick={() => {
                        setConfirmDelete({ email: admin.email, type: 'events' });
                        setAdmins(prev => prev.map(a => ({ ...a, showMenu: false })));
                      }}
                    >
                      <Calendar className="w-4 h-4 text-red-500" />
                      DELETE USER'S EVENTS
                    </button>
                    <button
                      className="flex w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 items-center gap-2 font-semibold"
                      onClick={() => {
                        setConfirmDelete({ email: admin.email, type: 'user' });
                        setAdmins(prev => prev.map(a => ({ ...a, showMenu: false })));
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

      {/* Add New User Button + Dialog */}
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
        <DialogContent className="bg-black text-white max-w-sm w-full rounded-xl p-0 overflow-hidden">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold mb-4">Add new user</DialogTitle>
            </DialogHeader>
            <div className="mb-4">
              <label className="block text-sm mb-2">User Role</label>
              <Select value={addUserRole} onValueChange={setAddUserRole}>
                <SelectTrigger className="w-full bg-neutral-900 border-none text-white">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 text-white">
                  <SelectItem value="admin">Admin</SelectItem>
                  {/* Có thể thêm các role khác nếu cần */}
                </SelectContent>
              </Select>
            </div>
            <div className="mb-4">
              <label className="block text-sm mb-2">Email</label>
              <Input
                type="email"
                value={addUserEmail}
                onChange={e => setAddUserEmail(e.target.value)}
                className="bg-neutral-900 border-none text-white placeholder:text-gray-400"
                placeholder="abc@xyz.com"
              />
            </div>
            {addUserError && <div className="text-red-400 text-sm mb-2">{addUserError}</div>}
          </div>
          <DialogFooter className="flex-row gap-0">
            <DialogClose asChild>
              <Button variant="ghost" className="w-1/2 rounded-none bg-black text-white border-r border-neutral-800 hover:bg-neutral-800">CANCEL</Button>
            </DialogClose>
            <Button onClick={handleAddUser} className="w-1/2 rounded-none bg-teal-200 text-black hover:bg-teal-300">ADD</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog xác nhận xóa user/events - chỉ render 1 lần, context theo confirmDelete */}
      <AlertDialog open={!!confirmDelete.type} onOpenChange={open => !open && setConfirmDelete({ email: '', type: null })}>
        <AlertDialogContent className="bg-black text-white max-w-sm w-full rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              {confirmDelete.type === 'user' ? 'Delete user' : 'Delete user\'s events'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300 mt-2">
              {confirmDelete.type === 'user'
                ? `This will permanently delete the user (${confirmDelete.email}) and all associated data.`
                : `This will permanently delete all events created by (${confirmDelete.email}).`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-0 mt-6">
            <AlertDialogCancel className="w-1/2 rounded-none bg-black text-white border-r border-neutral-800 hover:bg-neutral-800">CANCEL</AlertDialogCancel>
            <AlertDialogAction
              className="w-1/2 rounded-none bg-red-500 text-white hover:bg-red-600"
              onClick={async () => {
                if (confirmDelete.type === 'user') await handleDelete(confirmDelete.email);
                if (confirmDelete.type === 'events') await handleDeleteEvents(confirmDelete.email);
                setConfirmDelete({ email: '', type: null });
              }}
            >
              DELETE
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default ManageAdminsPage;
