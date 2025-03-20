import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getProvider } from "src/providers/factory";
import { revokeAccessToken } from "src/providers/identidad/authorization";
import { IUser } from "src/types/user";
import { getAuthStorage } from "./config/storage";
import { IAuthContext } from "./types";
import {
  refreshTokens,
  resetSignOutTimer,
  setupSignOutEvents,
  utilValidateSession,
} from "./utils";

const AuthContext = createContext<IAuthContext>({} as IAuthContext);

interface AuthProviderProps {
  children: React.ReactNode; // ReactNode is a type that represents anything that can be rendered in React
  clientId: string; // Id of client
  clientSecret?: string; // Secret of client
  realm?: string; // Realm of client
  provider: string; // Provider of client (e.g. "identidad")
  authorizationParams: {
    // Authorization parameters
    redirectUri: string; // Redirect URI when authentication is successful
    scope: string[]; // Scope
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
    isProduction,
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
  const [remainingSignOutTime, setRemainingSignOutTime] = useState<number>(
    signOutTime || 0
  );
  const signOutTimeoutRef = useRef<NodeJS.Timeout>();
  const signOutIntervalRef = useRef<NodeJS.Timeout>();
  const tokenIsFetched = useRef(false);

  const authStorage = useMemo(() => {
    return getAuthStorage(isProduction);
  }, [isProduction]);

  const loadUserFromStorage = async () => {
    if (tokenIsFetched.current) return;

    let savedUser: IUser | undefined;
    let savedAccessToken: string | undefined;

    savedUser = authStorage.getItem("user")
      ? JSON.parse(authStorage.getItem("user") as string)
      : undefined;

    savedAccessToken = authStorage.getItem("accessToken")
      ? (authStorage.getItem("accessToken") as string)
      : undefined;

    if (!savedUser || !savedAccessToken) {
      tokenIsFetched.current = true;

      const sessionData = await utilValidateSession(
        provider,
        clientId,
        clientSecret,
        realm,
        authorizationParams,
        authStorage
      );

      savedUser = sessionData?.user;
      savedAccessToken = sessionData?.accessToken;
    }

    if (savedUser && savedAccessToken) {
      setUser(savedUser);
      setAccessToken(savedAccessToken);
      setIsAuthenticated(true);
    }

    setIsLoading(false);
  };

  const setupRefreshInterval = () => {
    const interval = setInterval(() => {
      refreshTokens(setAccessToken, realm, clientId, clientSecret, authStorage);
    }, Number(authStorage.getItem("expiresIn")) / 2);

    return () => clearInterval(interval);
  };

  const loginWithRedirect = useCallback(async () => {
    const selectedProvider = getProvider(provider);

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
    authStorage,
  ]);

  const logout = useCallback(
    (sessionExpired?: boolean) => {
      if (accessToken && realm) {
        revokeAccessToken(accessToken, realm);
      }

      if (sessionExpired) {
        setIsSessionExpired(true);
      }

      authStorage.removeItem("user");
      authStorage.removeItem("accessToken");
      setUser(undefined);
      setAccessToken(undefined);
      setIsAuthenticated(false);
      setIsLoading(false);
    },
    [accessToken, realm, authStorage]
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
    loadUserFromStorage();

    return setupRefreshInterval();
  }, []);

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
