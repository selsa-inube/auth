import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
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
  withSignOutTimeout?: boolean;
  signOutTimeout?: number;
  redirectUrlOnTimeout?: string;
  resetSignOutMouseMove?: boolean;
  resetSignOutKeyDown?: boolean;
  resetSignOutMouseDown?: boolean;
  resetSignOutScroll?: boolean;
  resetSignOutTouchStart?: boolean;
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
    withSignOutTimeout,
    signOutTimeout: initialTimeout,
    redirectUrlOnTimeout,
    resetSignOutMouseMove = false,
    resetSignOutKeyDown = false,
    resetSignOutMouseDown = false,
    resetSignOutScroll = false,
    resetSignOutTouchStart = false,
  } = props;

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<IUser>();
  const [accessToken, setAccessToken] = useState<string>();
  const [signOutTimeout] = useState<number | undefined>(
    initialTimeout ? Number(initialTimeout) : undefined
  );
  const timeoutRef = useRef<NodeJS.Timeout>();

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

  const resetLogoutTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (signOutTimeout && redirectUrlOnTimeout) {
      timeoutRef.current = setTimeout(() => {
        if (!window.location.href.includes(redirectUrlOnTimeout)) {
          window.location.href = redirectUrlOnTimeout;
        }
      }, signOutTimeout);
    }
  }, [signOutTimeout, redirectUrlOnTimeout, window.location.href]);

  useEffect(() => {
    if (withSignOutTimeout && signOutTimeout && signOutTimeout > 0) {
      resetLogoutTimer();

      const eventConfig = [
        { event: "mousemove", flag: resetSignOutMouseMove },
        { event: "keydown", flag: resetSignOutKeyDown },
        { event: "mousedown", flag: resetSignOutMouseDown },
        { event: "scroll", flag: resetSignOutScroll },
        { event: "touchstart", flag: resetSignOutTouchStart },
      ];

      eventConfig.forEach(({ event, flag }) => {
        if (flag) {
          window.addEventListener(event, resetLogoutTimer);
        }
      });

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        eventConfig.forEach(({ event, flag }) => {
          if (flag) {
            window.removeEventListener(event, resetLogoutTimer);
          }
        });
      };
    }
  }, [
    signOutTimeout,
    withSignOutTimeout,
    resetSignOutMouseMove,
    resetSignOutKeyDown,
    resetSignOutMouseDown,
    resetSignOutScroll,
    resetSignOutTouchStart,
    resetLogoutTimer,
  ]);

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
    authStorage.setItem("accessToken", sessionData.accessToken);

    if (sessionData.refreshToken) {
      authStorage.setItem("refreshToken", sessionData.refreshToken);
      authStorage.setItem("expiresIn", sessionData.expiresIn.toString());
    }

    window?.location.replace(authorizationParams.redirectUri);
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
      resetSignOutScroll,
      loginWithRedirect,
      logout,
      resetLogoutTimer,
    }),
    [
      user,
      accessToken,
      isLoading,
      isAuthenticated,
      resetSignOutScroll,
      loginWithRedirect,
      logout,
      resetLogoutTimer,
    ]
  );

  return (
    <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>
  );
}

export { AuthContext, AuthProvider };
export type { AuthProviderProps };
