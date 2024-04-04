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
}

function AuthProvider(props: AuthProviderProps) {
  const {
    children,
    clientId,
    clientSecret,
    realm,
    authorizationParams,
    provider,
  } = props;

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<IUser>();
  const [accessToken, setAccessToken] = useState<string>();

  const loadUserFromStorage = () => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  };

  const refreshTokens = async () => {
    let savedAccessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

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

      localStorage.setItem("accessToken", refreshTokenResponse.accessToken);
      localStorage.setItem("refreshToken", refreshTokenResponse.refreshToken);
      localStorage.setItem("expiresIn", refreshTokenResponse.expiresIn);
    }
  };

  const setupRefreshInterval = () => {
    const interval = setInterval(
      refreshTokens,
      Number(localStorage.getItem("expiresIn")) / 2
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

    setUser(sessionData.user);
    setAccessToken(sessionData.accessToken);

    localStorage.setItem("user", JSON.stringify(sessionData.user));
    localStorage.setItem(
      "accessToken",
      JSON.stringify(sessionData.accessToken)
    );

    if (sessionData.refreshToken) {
      localStorage.setItem("refreshToken", sessionData.refreshToken);
      localStorage.setItem("expiresIn", JSON.stringify(sessionData.expiresIn));
    }

    setIsAuthenticated(true);
    setIsLoading(false);

    window && window.location.replace(authorizationParams.redirectUri);
  }, [user, authorizationParams.redirectUri]);

  const logout = useCallback(() => {
    if (accessToken && realm) {
      revokeAccessToken(accessToken, realm);
    }

    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
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
