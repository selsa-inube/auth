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

interface IAuthParams {
  clientId?: string; // Client ID (optional, depending on the provider's requirements)
  clientSecret?: string; // Client Secret (optional, depending on the provider's requirements)
  realm?: string; // Realm or tenant identifier for the authentication provider (optional, depending on the provider's requirements)
  originatorId?: string; // Originator ID for the authentication provider (optional, depending on the provider's requirements)
  applicationName?: string; // Application name for the authentication provider (optional, depending on the provider's requirements)
  redirectUri: string; // Redirect URI when authentication is successful
  scope: string[]; // Scope of authentication (e.g. [
  //    "openid",
  //    "email",
  //    "profile",
  //    "address",
  //    "phone",
  //    "identityDocument",
  //    ]
}

type ProviderType = "identidadv1" | "identidadv2" | "iauth";

export type { IAuthContext, IAuthParams, ProviderType };
