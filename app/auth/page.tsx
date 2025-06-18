'use client';

import Loading from '@/components/Loading';
import { useAuthCallback } from '@mysten/enoki/react';
import { useEffect } from 'react';
import { useCustomWallet } from '@/contexts/CustomWallet';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function Page() {
  const { handled } = useAuthCallback(); // This hook will handle the callback from the authentication provider
  const { emailAddress, logout } = useCustomWallet();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdmin = async () => {
      if (!handled || !emailAddress) return;
      const { data, error } = await supabase
        .from('admins')
        .select('id')
        .eq('email', emailAddress)
        .single();
      if (error || !data) {
        toast({
          title: 'Không có quyền truy cập',
          description: 'Email của bạn không nằm trong danh sách admin.',
          variant: 'destructive',
        });
        logout();
        router.replace('/');
      }
    };
    checkAdmin();
  }, [handled, emailAddress, logout, router, toast]);

  return <Loading />;
}