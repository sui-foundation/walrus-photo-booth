'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import ProfilePopover from './ProfilePopover';
import { useRouter } from 'next/navigation';

const Header: React.FC = () => {
  const router = useRouter();

  return (
    <header className="bg-neutral-900 text-white px-6 py-3 flex items-center justify-between">
      {}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-cyan-300 bg-white flex items-center justify-center">
          <Avatar size="md">
            <AvatarImage src="/walrus.jpg" alt="Walrus Logo" />
            <AvatarFallback>WL</AvatarFallback>
          </Avatar>
        </div>
        <div>
          <h1 className="text-2xl font-bold leading-tight font-neuebit">WALRUS</h1>
          <p className="text-base text-gray-300 leading-tight font-neuemontreal">Photobooth</p>
        </div>
      </div>

    </header>
  );
};

export default Header;
