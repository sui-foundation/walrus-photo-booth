'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import ProfilePopover from '@/components/ProfilePopover';
import { useCustomWallet } from '@/contexts/CustomWallet';
import { useAuthentication } from '@/contexts/Authentication';
import { ReactNode, useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface HeaderProps {
  variant?: 'main' | 'page' | 'minimal';
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightContent?: ReactNode;
  showNavigation?: boolean;
  showBranding?: boolean;
  enableMenuFunctionality?: boolean;
}

const UnifiedHeader: React.FC<HeaderProps> = ({
  variant = 'main',
  title,
  showBack = false,
  onBack,
  rightContent,
  showNavigation = true,
  showBranding = true,
  enableMenuFunctionality = false,
}) => {
  const router = useRouter();
  const { isConnected, emailAddress, logout: walletLogout } = useCustomWallet();
  const { user, handleLogout: authLogout } = useAuthentication();
  
  const [showMenu, setShowMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Get admin role from Supabase
  const [adminRole, setAdminRole] = useState<string | null>(null);
  
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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // Clear authentication state
      if (authLogout) {
        authLogout();
      }
      
      // Disconnect wallet
      if (walletLogout) {
        walletLogout();
      }
      
      // Clear all local storage
      localStorage.clear();
      sessionStorage.clear();
      
      setShowMenu(false);
      
      // Small delay for user feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload the page to ensure clean state
      window.location.reload();
      
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback: force reload even if logout fails
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const BrandingSection = () => (
    <Link href="/" className="flex items-center gap-3 group" aria-label="Go to Home">
      <Image
        src="/favicon.ico"
        alt="Logo"
        width={32}
        height={32}
        className="rounded-sm group-hover:opacity-80 transition"
      />
      <div>
        <div className="text-3xl font-bold leading-tight font-neuebit">WALRUS</div>
        <div className="text-l font-neuemontreal text-white/60 leading-tight" style={{letterSpacing: 0}}>
          PHOTOBOOTH
        </div>
      </div>
    </Link>
  );

  const NavigationSection = () => (
    <div className="flex items-center gap-3">
      {!isConnected && <ProfilePopover />}
      {isConnected && (
        <>
          <Link
            href="/photo-booth"
            className="bg-neutral-900 text-white text-base font-semibold px-5 py-2 rounded-lg border border-white/20 shadow hover:bg-neutral-800 transition-all mr-3"
          >
            PHOTO BOOTH
          </Link>
          <Link
            href="/addEvent"
            className="bg-cyan-200 text-neutral-900 text-base font-semibold px-6 py-2 rounded-lg border border-cyan-300 shadow hover:bg-cyan-100 transition-all"
          >
            CREATE EVENT
          </Link>
          <Image
            src="/on.png"
            alt="Profile Menu"
            width={40}
            height={40}
            className="rounded-full hover:opacity-80 transition cursor-pointer"
            onClick={() => enableMenuFunctionality && setShowMenu(!showMenu)}
          />
        </>
      )}
    </div>
  );

  // Main variant - for homepage
  if (variant === 'main') {
    return (
      <>
        <div className="bg-neutral-900 text-white">
          <div className="px-4 py-3 flex justify-between items-center border-b border-white/10 relative font-neuemontreal">
            {showBranding && <BrandingSection />}
            {showNavigation && <NavigationSection />}
          </div>
          <div className="text-center py-6">
            <h1 className="text-5xl font-neuebit tracking-wide uppercase">EVENT ALBUMS</h1>
            <p className="text-sm mt-1 text-white/70 font-neuemontreal">
              The latest updates, direct from your favorite mammal
            </p>
          </div>
        </div>

        {/* Admin Menu */}
        {enableMenuFunctionality && showMenu && isConnected && (
          <div ref={menuRef} className="absolute top-16 right-4 z-50 w-80 bg-white border border-gray-200 shadow-2xl rounded-2xl text-sm text-gray-800 p-5 space-y-5 animate-fade-in font-neuemontreal">
            <div>
              <h2 className="text-base font-neuebit flex items-center gap-2">
                <span className="text-lg">👤</span>Account Info
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-neuemontreal">Managed via Enoki zkLogin</p>
            </div>
            <div className="border-t border-gray-200 pt-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Role:</span>
                <span className="text-gray-800">{adminRole || 'Admin'}</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="font-medium text-gray-600">Email:</span>
                <span className="text-gray-800 break-words">{emailAddress}</span>
              </div>
            </div>
            <div className="pt-3 flex flex-col gap-3">
              {adminRole === 'super admin' && (
                <Link
                  href="/manage/users"
                  className="text-center rounded-lg border border-indigo-600 text-indigo-600 py-2 font-semibold hover:bg-indigo-50 transition duration-200"
                >
                  Go to Admin Panel
                </Link>
              )}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`text-center rounded-lg py-2 font-semibold transition duration-200 ${
                  isLoggingOut 
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Page variant - for internal pages with title and back button
  if (variant === 'page') {
    return (
      <div className="w-full bg-black text-white flex flex-col border-b border-white/10">
        <div className="flex items-center px-2 py-2 gap-2">
          {showBack && (
            <button
              onClick={handleBack}
              className="p-2 rounded hover:bg-white/10 flex items-center"
            >
              <ArrowLeft className="w-6 h-6" />
              <span className="ml-1 text-base">Back</span>
            </button>
          )}
          <div className="flex-1 flex justify-center">
            {title && (
              <span
                className="text-4xl font-neuebit tracking-widest"
                style={{ letterSpacing: 2 }}
              >
                {title.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 min-w-[48px]">
            {rightContent || (
              <img
                src="/on.png"
                alt="Logo"
                width={40}
                height={40}
                className="rounded-full hover:opacity-80 transition cursor-pointer ml-2"
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Minimal variant - for simple headers
  if (variant === 'minimal') {
    return (
      <div className="w-full bg-black text-white flex justify-between items-center px-4 py-3 border-b border-white/10">
        {showBranding && <BrandingSection />}
        {showBack && (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
        )}
        {rightContent}
      </div>
    );
  }

  return null;
};

export default UnifiedHeader;
