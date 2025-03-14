import { IUser } from "src/types/user";

interface IAuthContext {
  user?: IUser;
  accessToken?: string;
  isLoading: boolean;
  isAuthenticated: boolean;
  resetSignOutScroll: boolean;

  loginWithRedirect: () => void;
  logout: () => void;
  resetLogoutTimer: () => void;
}

export type { IAuthContext };
