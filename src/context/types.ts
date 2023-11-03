import { IUser } from "src/types/user";

interface IAuthContext {
  user?: IUser;
  isLoading: boolean;
  isAuthenticated: boolean;

  loginWithRedirect: () => void;
  logout: () => void;
}

export type { IAuthContext };
