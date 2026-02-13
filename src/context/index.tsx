import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getProvider } from "src/providers/factory";
import { IUser } from "src/types/user";
import { IAuthContext, ProviderType } from "./types";
import { resetSignOutTimer, setupSignOutEvents } from "./utils";

const AuthContext = createContext<IAuthContext>({} as IAuthContext);

interface AuthProviderProps {
  children: React.ReactNode; // ReactNode is a type that represents anything that can be rendered in React
  clientId: string; // Id of client
  clientSecret?: string; // Secret of client
  realm?: string; // Realm of client
  provider: ProviderType; // Provider of client (e.g. "identidad" or "identidadv2")
  authorizationParams: {
    // Authorization parameters
    redirectUri: string; // Redirect URI when authentication is successful
    scope: string[]; // Scope of authentication (e.g. [
    //    "openid",
    //    "email",
    //    "profile",
    //    "address",
    //    "phone",
    //    "identityDocument",
    //    ]
  };
  isProduction?: boolean; // Is production environment, define for deciding which storage to use dev = localStorage, prod = sessionStorage
  withSignOutTimeout?: boolean; // With sign out in timeout
  signOutTime?: number; // Sign out time
  redirectUrlOnTimeout?: string; // Redirect URL on timeout
  resetSignOutMouseMove?: boolean; // Reset sign out on mouse move
  resetSignOutKeyDown?: boolean; // Reset sign out on key down
  resetSignOutMouseDown?: boolean; // Reset sign out on mouse down
  resetSignOutScroll?: boolean; // Reset sign out on scroll
  resetSignOutTouchStart?: boolean; // Reset sign out on touch start
  resetSignOutChangePage?: boolean; // Reset sign out on change page
  signOutCritialPaths?: string[]; // This routes will reset the sign out timer
}

function AuthProvider(props: AuthProviderProps) {
  const {
    children,
    clientId,
    clientSecret,
    realm,
    authorizationParams,
    provider,
    isProduction = false,
    withSignOutTimeout,
    signOutTime,
    redirectUrlOnTimeout,
    resetSignOutMouseMove = false,
    resetSignOutKeyDown = false,
    resetSignOutMouseDown = false,
    resetSignOutScroll = false,
    resetSignOutTouchStart = false,
    resetSignOutChangePage = false,
    signOutCritialPaths,
  } = props;

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<IUser>();
  const [accessToken, setAccessToken] = useState<string>();
  const [isSessionExpired, setIsSessionExpired] = useState(() => {
    const selectedProvider = getProvider(provider);
    return selectedProvider.getSessionExpired?.(isProduction) ?? false;
  });
  const [remainingSignOutTime, setRemainingSignOutTime] = useState<number>(
    signOutTime || 0
  );
  const signOutTimeoutRef = useRef<NodeJS.Timeout>(null);
  const signOutIntervalRef = useRef<NodeJS.Timeout>(null);
  const tokenIsFetched = useRef(false);
  const [expiresIn, setExpiresIn] = useState<number>();

  const setupRefreshInterval = () => {
    if (!expiresIn || !realm || !clientId || !clientSecret) return;
    const selectedProvider = getProvider(provider);

    const interval = setInterval(async () => {
      const tokens = await selectedProvider.refreshSession(
        realm,
        clientId,
        clientSecret,
        isProduction
      );

      if (tokens) {
        setExpiresIn(Number(tokens.expiresIn));
        setAccessToken(tokens.accessToken);
      }
    }, expiresIn / 2);

    return () => clearInterval(interval);
  };

  const loadUserFromStorage = async () => {
    if (tokenIsFetched.current || !realm) return;

    if (isSessionExpired) {
      setIsLoading(false);
      return;
    }

    const selectedProvider = getProvider(provider);

    const sessionData = await selectedProvider.validateSession(
      {
        clientId,
        clientSecret,
        realm,
        authorizationParams,
      },
      isProduction,
      tokenIsFetched,
      setupRefreshInterval
    );

    if (sessionData?.user && sessionData?.accessToken) {
      selectedProvider.removeSessionExpired?.(isProduction);
      setIsSessionExpired(false);
      setUser(sessionData.user);
      setAccessToken(sessionData.accessToken);
      setIsAuthenticated(true);
    }

    setIsLoading(false);
  };

  const loginWithRedirect = useCallback(async () => {
    if (!realm) return;
    const selectedProvider = getProvider(provider);

    setIsSessionExpired(false);

    await selectedProvider.loginWithRedirect({
      clientId,
      clientSecret,
      realm,
      authorizationParams,
    },
    isProduction
  );
  }, [
    provider,
    clientId,
    clientSecret,
    realm,
    authorizationParams,
    isProduction,
  ]);

  const logout = useCallback(
    (sessionExpired?: boolean) => {
      const selectedProvider = getProvider(provider);

      if (sessionExpired) {
        selectedProvider.setSessionExpired?.(isProduction);
        setIsSessionExpired(true);
      }

      if (accessToken && realm) {
        selectedProvider.logout(accessToken, realm, isProduction, sessionExpired);
      }

      setUser(undefined);
      setAccessToken(undefined);
      setIsAuthenticated(false);
      setIsLoading(false);
    },
    [accessToken, realm, isProduction]
  );

  useEffect(() => {
    resetSignOutTimer(
      signOutTimeoutRef,
      signOutIntervalRef,
      withSignOutTimeout || false,
      signOutTime,
      redirectUrlOnTimeout,
      remainingSignOutTime,
      signOutCritialPaths,
      setRemainingSignOutTime,
      logout
    );

    return setupSignOutEvents(
      withSignOutTimeout || false,
      signOutTime,
      signOutTimeoutRef,
      signOutIntervalRef,
      redirectUrlOnTimeout,
      remainingSignOutTime,
      resetSignOutMouseMove,
      resetSignOutKeyDown,
      resetSignOutMouseDown,
      resetSignOutScroll,
      resetSignOutTouchStart,
      resetSignOutChangePage,
      signOutCritialPaths,
      setRemainingSignOutTime,
      logout
    );
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated && isSessionExpired) {
      logout();
    }
  }, [isLoading, isAuthenticated, isSessionExpired]);

  useEffect(() => {
    loadUserFromStorage();

    const selectedProvider = getProvider(provider);

    const storedExpiresIn = selectedProvider.getExpiredTime(isProduction);
    if (storedExpiresIn) {
      setExpiresIn(storedExpiresIn);
    }
  }, []);

  useEffect(() => {
    const cleanup = setupRefreshInterval();
    return cleanup;
  }, [expiresIn]);

  const authContext = useMemo(
    () => ({
      user,
      accessToken,
      isLoading,
      isAuthenticated,
      remainingSignOutTime,
      isSessionExpired,
      loginWithRedirect,
      logout,
    }),
    [
      user,
      accessToken,
      isLoading,
      isAuthenticated,
      remainingSignOutTime,
      isSessionExpired,
      loginWithRedirect,
      logout,
    ]
  );

  return (
    <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>
  );
}

export { AuthContext, AuthProvider };
export type { AuthProviderProps };
