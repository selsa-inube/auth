import { getAuthStorage } from "src/context/config/storage";
import { IUser } from "src/types/user";
import {
  getAccessToken,
  getAuthorizationCode,
  ISessionData,
  refreshAccessToken,
  requestAuthorizationCode,
  revokeAccessToken,
  verifyAccessToken,
} from "./authorization";

const loginWithRedirect = async (
  options: Record<string, any>,
  _: boolean
): Promise<void> => {
  const { clientId, clientSecret, realm, authorizationParams, isProduction } = options;

  if (!clientSecret || !realm) return;

  const { redirectUri, scope } = authorizationParams;

  const authStorage = getAuthStorage(isProduction);
  authStorage.clear();
  window.history.replaceState({}, "", "/");

  await requestAuthorizationCode(
    clientId,
    clientSecret,
    realm,
    redirectUri,
    scope
  );
};

const validateSession = async (
  options: Record<string, any>,
  isProduction: boolean,
  tokenIsFetched: React.RefObject<boolean>,
  setupRefreshInterval: () => void
): Promise<ISessionData | undefined> => {
  const authStorage = getAuthStorage(isProduction);

  let savedUser: IUser | undefined;
  let savedAccessToken: string | undefined;
  let savedRefreshToken: string | undefined;
  let savedExpiresIn: string | undefined;

  savedUser = authStorage.getItem("user")
    ? JSON.parse(authStorage.getItem("user") as string)
    : undefined;

  savedAccessToken = authStorage.getItem("accessToken")
    ? (authStorage.getItem("accessToken") as string)
    : undefined;

  savedRefreshToken = authStorage.getItem("refreshToken")
    ? (authStorage.getItem("refreshToken") as string)
    : undefined;

  savedExpiresIn = authStorage.getItem("expiresIn")
    ? (authStorage.getItem("expiresIn") as string)
    : undefined;

  if (!savedUser || !savedAccessToken) {
    tokenIsFetched.current = true;

    const { clientId, clientSecret, realm, authorizationParams } = options;
    const { redirectUri } = authorizationParams;

    const { authorizationCode, state } = getAuthorizationCode();

    if (!authorizationCode || !state) return;

    window.history.replaceState({}, document.title, window.location.pathname);

    const accessTokenResponse = await getAccessToken(
      authorizationCode,
      clientId,
      clientSecret,
      realm,
      redirectUri
    );

    if (!accessTokenResponse) return;

    const sessionData = await verifyAccessToken(
      accessTokenResponse.accessToken,
      realm
    );

    if (!sessionData) return;

    if (sessionData?.expiresIn) {
      setupRefreshInterval();
    }

    authStorage.setItem("user", JSON.stringify(sessionData.user));
    authStorage.setItem("accessToken", sessionData.accessToken);
    authStorage.setItem("expiresIn", sessionData.expiresIn.toString());

    savedUser = sessionData?.user;
    savedAccessToken = accessTokenResponse.accessToken;
    savedExpiresIn = accessTokenResponse.expiresIn;

    if (sessionData.refreshToken) {
      authStorage.setItem("refreshToken", sessionData.refreshToken);

      savedRefreshToken = accessTokenResponse.refreshToken;
    }
  }

  return {
    idSesion: savedUser.id,
    user: savedUser,
    accessToken: savedAccessToken,
    refreshToken: savedRefreshToken,
    expiresIn: Number(savedExpiresIn),
  };
};

const refreshSession = async (
  realm: string,
  clientId: string,
  clientSecret: string,
  isProduction: boolean
) => {
  const authStorage = getAuthStorage(isProduction);

  const savedAccessToken = authStorage.getItem("accessToken");
  const refreshToken = authStorage.getItem("refreshToken");

  if (savedAccessToken && realm && clientSecret && refreshToken) {
    const refreshTokenResponse = await refreshAccessToken(
      savedAccessToken,
      realm,
      clientId,
      clientSecret,
      refreshToken
    );
    if (!refreshTokenResponse) return;

    authStorage.setItem("accessToken", refreshTokenResponse.accessToken);
    authStorage.setItem("refreshToken", refreshTokenResponse.refreshToken);
    authStorage.setItem("expiresIn", refreshTokenResponse.expiresIn);

    return refreshTokenResponse;
  }
};

const logout = async (
  accessToken: string,
  realm: string,
  isProduction: boolean,
) => {
  await revokeAccessToken(accessToken, realm);

  const authStorage = getAuthStorage(isProduction);

  authStorage.removeItem("user");
  authStorage.removeItem("accessToken");
  authStorage.removeItem("refreshToken");
  authStorage.removeItem("expiresIn");
};

const getExpiredTime = (isProduction: boolean): number | null => {
  const authStorage = getAuthStorage(isProduction);

  const expiresIn = authStorage.getItem("expiresIn");

  return expiresIn ? Number(expiresIn) : null;
};

const setSessionExpired = (isProduction: boolean) =>
  getAuthStorage(isProduction).setItem("sessionExpired", "true");

const removeSessionExpired = (isProduction: boolean) =>
  getAuthStorage(isProduction).removeItem("sessionExpired");

const getSessionExpired = (isProduction: boolean): boolean =>
  getAuthStorage(isProduction).getItem("sessionExpired") === "true";

const identidadV1Repository = {
  loginWithRedirect,
  validateSession,
  refreshSession,
  logout,
  getExpiredTime,
  setSessionExpired,
  removeSessionExpired,
  getSessionExpired,
};

export { identidadV1Repository };
