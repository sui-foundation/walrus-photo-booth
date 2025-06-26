export type UserRole = "super_admin" | "admin" | "moderator" | "member" | "anonymous";

export interface UserProps {
  avatar_url: any;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  picture: string;
}

export interface AuthenticationContextProps {
  user: UserProps;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  handleLoginAs: (user: UserProps) => void;
  handleLogout: () => void;
  isSuperAdmin: boolean;
}