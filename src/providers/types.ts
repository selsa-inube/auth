import { IUser } from "src/types/user";

interface IProviderRepository {
  loginWithRedirect: (
    options: Record<string, any>
  ) => Promise<IUser | undefined>;
}

export type { IProviderRepository };
