'use client';

import Loading from '@/components/Loading';
import { useAuthCallback } from '@mysten/enoki/react';
import { useEffect, useState } from 'react';
import { useCustomWallet } from '@/contexts/CustomWallet';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Page() {
  const { handled } = useAuthCallback(); // This hook will handle the callback from the authentication provider
  const { emailAddress, logout } = useCustomWallet();
  const router = useRouter();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!handled || !emailAddress) return;
      const { data, error } = await supabase
        .from('admins')
        .select('id')
        .eq('email', emailAddress)
        .single();
      if (error || !data) {
        setErrorMessage(
          'Looks like you are not an administrator. You can view past events and photos without signing in.'
        );
        setTimeout(() => {
          logout();
          router.replace('/');
        }, 5000);
        return;
      } else {
        router.replace('/');
      }
    };
    checkAdmin();
  }, [handled, emailAddress, logout, router]);

  if (errorMessage) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{
          background: '#fee2e2',
          color: '#b91c1c',
          padding: '24px 32px',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '18px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          {errorMessage}
        </div>
      </div>
    );
  }

  return <Loading />;
}