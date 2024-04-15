import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getProvider } from "src/providers/factory";
import {
  refreshAccessToken,
  revokeAccessToken,
} from "src/providers/identidad/authorization";
import { IUser } from "src/types/user";
import { getAuthStorage } from "./config/storage";
import { IAuthContext } from "./types";

const AuthContext = createContext<IAuthContext>({} as IAuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
  clientId: string;
  clientSecret?: string;
  realm?: string;
  provider: string;
  authorizationParams: {
    redirectUri: string;
    scope: string[];
  };
  isProduction?: boolean;
}

function AuthProvider(props: AuthProviderProps) {
  const {
    children,
    clientId,
    clientSecret,
    realm,
    authorizationParams,
    provider,
    isProduction,
  } = props;

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<IUser>();
  const [accessToken, setAccessToken] = useState<string>();

  const authStorage = useMemo(() => {
    return getAuthStorage(isProduction);
  }, [isProduction]);

  const loadUserFromStorage = () => {
    const savedUser = authStorage.getItem("user");
    const savedAccessToken = authStorage.getItem("accessToken");

    if (savedUser && savedAccessToken) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
      setAccessToken(savedAccessToken);
    }
    setIsLoading(false);
  };

  const refreshTokens = async () => {
    const savedAccessToken = authStorage.getItem("accessToken");
    const refreshToken = authStorage.getItem("refreshToken");

    savedAccessToken && setAccessToken(savedAccessToken);

    if (savedAccessToken && realm && clientSecret && refreshToken) {
      const refreshTokenResponse = await refreshAccessToken(
        savedAccessToken,
        realm,
        clientId,
        clientSecret,
        refreshToken
      );

      if (!refreshTokenResponse) return;

      setAccessToken(refreshTokenResponse.accessToken);

      authStorage.setItem("accessToken", refreshTokenResponse.accessToken);
      authStorage.setItem("refreshToken", refreshTokenResponse.refreshToken);
      authStorage.setItem("expiresIn", refreshTokenResponse.expiresIn);
    }
  };

  const setupRefreshInterval = () => {
    const interval = setInterval(
      refreshTokens,
      Number(authStorage.getItem("expiresIn")) / 2
    );
    return () => clearInterval(interval);
  };

  useEffect(() => {
    loadUserFromStorage();

    return setupRefreshInterval();
  }, []);

  const loginWithRedirect = useCallback(async () => {
    const selectedProvider = getProvider(provider);

    const sessionData = await selectedProvider.loginWithRedirect({
      clientId,
      clientSecret,
      realm,
      authorizationParams,
    });

    if (!sessionData) return;

    authStorage.setItem("user", JSON.stringify(sessionData.user));
    authStorage.setItem("accessToken", JSON.stringify(sessionData.accessToken));

    if (sessionData.refreshToken) {
      authStorage.setItem("refreshToken", sessionData.refreshToken);
      authStorage.setItem("expiresIn", JSON.stringify(sessionData.expiresIn));
    }

    window && window.location.replace(authorizationParams.redirectUri);
  }, [user, authorizationParams.redirectUri]);

  const logout = useCallback(() => {
    if (accessToken && realm) {
      revokeAccessToken(accessToken, realm);
    }

    authStorage.removeItem("user");
    authStorage.removeItem("accessToken");
    setUser(undefined);
    setAccessToken(undefined);
    setIsAuthenticated(false);
    setIsLoading(false);
  }, [accessToken]);

  const authContext = useMemo(
    () => ({
      user,
      accessToken,
      isLoading,
      isAuthenticated,

      loginWithRedirect,
      logout,
    }),
    [user, accessToken, isLoading, isAuthenticated, loginWithRedirect, logout]
  );

  return (
    <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>
  );
}

export { AuthContext, AuthProvider };
export type { AuthProviderProps };
