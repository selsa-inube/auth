import { ISessionData } from "./identidad/authorization";

interface IProviderRepository {
  loginWithRedirect: (options: Record<string, any>) => Promise<void>;
  validateSession: (
    options: Record<string, any>
  ) => Promise<ISessionData | undefined>;
}

export type { IProviderRepository };
