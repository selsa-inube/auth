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

const SESSION_EXPIRED_KEY = "sessionExpired";

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
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [isForceLogout, setIsForceLogout] = useState(() => sessionStorage.getItem(SESSION_EXPIRED_KEY) === "true");
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
    if (tokenIsFetched.current) return;

    const selectedProvider = getProvider(provider);

    const sessionData = await selectedProvider.validateSession(
      {
        clientId,
        clientSecret,
        realm,
        authorizationParams,
        isProduction,
      },
      isProduction || false,
      tokenIsFetched,
      setupRefreshInterval
    );

    if (sessionData?.user && sessionData?.accessToken) {
      setUser(sessionData.user);
      setAccessToken(sessionData.accessToken);
      setIsAuthenticated(true);
    }

    setIsLoading(false);
  };

  const loginWithRedirect = useCallback(async () => {
    const selectedProvider = getProvider(provider);

    sessionStorage.clear();
    window.history.replaceState({}, "", "/");

    await selectedProvider.loginWithRedirect({
      clientId,
      clientSecret,
      realm,
      authorizationParams,
    });
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
      if (accessToken && realm) {
        const selectedProvider = getProvider(provider);

        selectedProvider.logout(accessToken, realm, isProduction);
      }

      if (sessionExpired) {
        setIsSessionExpired(true);
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
    if (isSessionExpired) {
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem(SESSION_EXPIRED_KEY, "true");
      setIsForceLogout(true);
    }
  }, [isSessionExpired]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && isForceLogout) {
      logout();
    }
  }, [isLoading, isAuthenticated, isForceLogout]);

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

  const combinedIsSessionExpired = isSessionExpired || isForceLogout;

  const authContext = useMemo(
    () => ({
      user,
      accessToken,
      isLoading,
      isAuthenticated,
      remainingSignOutTime,
      isSessionExpired: combinedIsSessionExpired,
      loginWithRedirect,
      logout,
    }),
    [
      user,
      accessToken,
      isLoading,
      isAuthenticated,
      remainingSignOutTime,
      combinedIsSessionExpired,
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
