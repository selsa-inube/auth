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
import { IAuthContext, IAuthParams, ProviderType } from "./types";
import {
  resetSignOutTimer,
  setupSignOutEvents,
  validateProvider,
} from "./utils";

const AuthContext = createContext<IAuthContext>({} as IAuthContext);

interface AuthProviderProps {
  children: React.ReactNode; // ReactNode is a type that represents anything that can be rendered in React
  provider: ProviderType; // Provider of client (e.g. "identidadv1" or "identidadv2" or "iauth")
  authParams: IAuthParams; // Authentication parameters specific to the provider
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
    authParams,
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
    if (!expiresIn) return;
    const selectedProvider = getProvider(provider);

    const interval = setInterval(async () => {
      const tokens = await selectedProvider.refreshSession(
        authParams,
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
    if (tokenIsFetched.current) return;

    if (isSessionExpired) {
      setIsLoading(false);
      return;
    }

    const selectedProvider = getProvider(provider);

    const sessionData = await selectedProvider.validateSession(
      authParams,
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
    const selectedProvider = getProvider(provider);

    setIsSessionExpired(false);

    await selectedProvider.loginWithRedirect(authParams, isProduction);
  }, [provider, authParams, isProduction]);

  const logout = useCallback(
    (sessionExpired?: boolean) => {
      const selectedProvider = getProvider(provider);

      if (sessionExpired) {
        selectedProvider.setSessionExpired?.(isProduction);
        setIsSessionExpired(true);
      }

      if (accessToken) {
        selectedProvider.logout(
          accessToken,
          authParams,
          isProduction,
          sessionExpired
        );
      }

      setUser(undefined);
      setAccessToken(undefined);
      setIsAuthenticated(false);
      setIsLoading(false);
    },
    [accessToken, authParams, isProduction]
  );

  useEffect(() => {
    if (!isLoading && isAuthenticated && isSessionExpired) {
      logout();
    }
  }, [isLoading, isAuthenticated, isSessionExpired]);

  useEffect(() => {
    validateProvider(provider, authParams);

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

    loadUserFromStorage();

    const selectedProvider = getProvider(provider);

    const storedExpiresIn = selectedProvider.getExpiredTime(isProduction);
    if (storedExpiresIn) {
      setExpiresIn(storedExpiresIn);
    }

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
