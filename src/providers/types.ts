import { IUser } from "src/types/user";

interface ISessionData {
  idSesion: string;
  accessToken: string;
  user: IUser;
  expiresIn: number;
  refreshToken?: string;
}

interface IProviderRepository {
  loginWithRedirect: (options: Record<string, any>) => Promise<void>;

  validateSession: (
    options: Record<string, any>,
    isProduction: boolean,
    tokenIsFetched: React.RefObject<boolean>,
    setupRefreshInterval: () => void
  ) => Promise<ISessionData | undefined>;

  refreshSession: (
    realm: string,
    clientId: string,
    clientSecret: string,
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
    realm: string,
    isProduction: boolean
  ) => Promise<void>;

  getExpiredTime: (isProduction: boolean) => number | null;
}

export type { IProviderRepository, ISessionData };
