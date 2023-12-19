import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getProvider } from "src/providers/factory";
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

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const loginWithRedirect = useCallback(async () => {
    const selectedProvider = getProvider(provider);

    const user = await selectedProvider.loginWithRedirect({
      clientId,
      clientSecret,
      realm,
      authorizationParams,
    });

    if (!user) return;

    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));

    setIsAuthenticated(true);
    setIsLoading(false);

    window && window.location.replace(authorizationParams.redirectUri);
  }, [user, authorizationParams.redirectUri]);

  const logout = useCallback(() => {
    localStorage.removeItem("user");
    setUser(undefined);
    setIsAuthenticated(false);
  }, []);

  const authContext = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated,

      loginWithRedirect,
      logout,
    }),
    [user, isLoading, isAuthenticated, loginWithRedirect, logout]
  );

  return (
    <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>
  );
}

export { AuthContext, AuthProvider };
export type { AuthProviderProps };
