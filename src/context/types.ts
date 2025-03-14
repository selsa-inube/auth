import { IUser } from "src/types/user";

interface IAuthContext {
  user?: IUser;
  accessToken?: string;
  isLoading: boolean;
  isAuthenticated: boolean;
  remainingSignOutTime?: number;
  isSessionExpired?: boolean;

  loginWithRedirect: () => void;
  logout: () => void;
}

export type { IAuthContext };
