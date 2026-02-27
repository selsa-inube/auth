import { IAuthParams } from "src/context/types";
import { IUser } from "src/types/user";

interface ISessionData {
  accessToken: string;
  user: IUser;
}

interface IProviderRepository {
  hasRedirectLogout: boolean;

  loginWithRedirect: (
    authParams: IAuthParams,
    isProduction: boolean
  ) => Promise<void>;

  validateSession: (
    authParams: IAuthParams,
    isProduction: boolean,
    tokenIsFetched: React.RefObject<boolean>,
    setupRefreshInterval: () => void
  ) => Promise<ISessionData | undefined>;

  refreshSession: (
    authParams: IAuthParams,
    isProduction: boolean
  ) => Promise<
    | {
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
      }
    | undefined
  >;

  logout: (
    accessToken: string,
    authParams: IAuthParams,
    isProduction: boolean,
    sessionExpired?: boolean
  ) => Promise<void>;

  getExpiredTime: (isProduction: boolean) => number | null;
}

export type { IProviderRepository, ISessionData };
