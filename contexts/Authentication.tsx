import { useCallback, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthenticationContextProps, UserProps } from '@/types/Authentication';
import { createContext } from 'react';
import { ChildrenProps } from '@/types/ChildrenProps';
import { isFollowingUserPropsSchema } from '@/helpers/isFollowingUserPropsSchema';
import { supabase } from '@/lib/supabaseClient';

export const anonymousUser: UserProps = {
  firstName: '',
  lastName: '',
  role: 'anonymous',
  email: '',
  picture: '',
  avatar_url: null, // Added avatar_url property
};

export const useAuthentication = () => {
  const context = useContext(AuthenticationContext);
  return context;
};

export const AuthenticationContext = createContext<AuthenticationContextProps>({
  user: anonymousUser,
  isLoading: false,
  setIsLoading: () => {},
  handleLoginAs: () => {},
  handleLogout: () => {},
  isSuperAdmin: false,
});

export const AuthenticationProvider = ({ children }: ChildrenProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<UserProps>(anonymousUser);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);

  const fetchRandomAvatar = async () => {
    const { data, error } = await supabase
      .from('avatars')
      .select('avatar_url');

    if (error) {
      console.error('Error fetching avatars:', error);
      return null;
    }

    if (data && data.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.length);
      return data[randomIndex].avatar_url;
    }

    return null;
  };

  const handleLoginAs = useCallback(
    async (newUser: UserProps) => {
      const randomAvatar = await fetchRandomAvatar();
      const updatedUser = { ...newUser, avatar_url: randomAvatar };

      setUser(updatedUser);
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
      sessionStorage.setItem('userRole', updatedUser.role);

      setIsSuperAdmin(updatedUser.role === 'super_admin');
    },
    [router, pathname]
  );

  useEffect(() => {
    const initialUser = sessionStorage.getItem('user');
    if (initialUser) {
      const parsedUser = JSON.parse(initialUser);
      handleLoginAs(parsedUser);
    } else {
      setUser(anonymousUser);
      setIsSuperAdmin(false);
    }
    setIsLoading(false);
  }, [handleLoginAs, router]);

  const handleLogout = () => {
    setUser(anonymousUser);
    setIsSuperAdmin(false);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('userRole');
    router.push('/');
  };

  return (
    <AuthenticationContext.Provider
      value={{
        user,
        isLoading,
        setIsLoading,
        handleLoginAs,
        handleLogout,
        isSuperAdmin,
      }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
};