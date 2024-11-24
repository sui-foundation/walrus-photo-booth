'use client';

import { useState, useEffect } from 'react';
import { useCustomWallet } from '@/contexts/CustomWallet';
import { useRouter } from 'next/navigation';

import PhotoBooth from '@/components/PhotoBooth';
import Loading from '@/components/Loading';
import ProfilePopover from '@/components/ProfilePopover';

const PhotoBoothPage: React.FC = () => {
  const { isConnected } = useCustomWallet();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isConnected) {
    }
    setIsLoading(false);
  }, [isConnected, router]);

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
        <PhotoBooth />
      </div>
    </main>
  );
};

export default PhotoBoothPage;
