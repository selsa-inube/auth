import { getAuthStorage } from "src/context/config/storage";
import { IAuthParams } from "src/context/types";
import { IUser } from "src/types/user";
import { getAuthorizationCode } from "src/utils/params";
import { ISessionData } from "../types";
import { identidadv1Auth } from "./authorization";

const loginWithRedirect = async (
  authParams: IAuthParams,
  isProduction: boolean
): Promise<void> => {
  const { clientId, clientSecret, realm, redirectUri, scope } = authParams;
  authParams;

  if (!clientSecret || !realm || !clientId) return;

  const authStorage = getAuthStorage(isProduction);
  authStorage.clear();
  window.history.replaceState({}, "", "/");

  await identidadv1Auth.requestAuthorizationCode(
    clientId,
    clientSecret,
    realm,
    redirectUri,
    scope
  );
};

const validateSession = async (
  authParams: IAuthParams,
  isProduction: boolean,
  tokenIsFetched: React.RefObject<boolean>,
  setupRefreshInterval: () => void
): Promise<ISessionData | undefined> => {
  const authStorage = getAuthStorage(isProduction);

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

    const { clientId, clientSecret, realm, redirectUri } = authParams;

    const { authorizationCode, state } = getAuthorizationCode();

    if (!authorizationCode || !state || !clientId || !clientSecret || !realm)
      return;

    window.history.replaceState({}, document.title, window.location.pathname);

    const accessTokenResponse = await identidadv1Auth.getAccessToken(
      authorizationCode,
      clientId,
      clientSecret,
      realm,
      redirectUri
    );

    if (!accessTokenResponse) return;

    const userData = await identidadv1Auth.getUserData(
      accessTokenResponse.accessToken,
      realm
    );

    if (!userData) return;

    if (accessTokenResponse?.expiresIn) {
      setupRefreshInterval();
    }

    authStorage.setItem("user", JSON.stringify(userData));
    authStorage.setItem("accessToken", accessTokenResponse.accessToken);
    authStorage.setItem("expiresIn", accessTokenResponse.expiresIn.toString());

    savedUser = userData;
    savedAccessToken = accessTokenResponse.accessToken;

    if (accessTokenResponse.refreshToken) {
      authStorage.setItem("refreshToken", accessTokenResponse.refreshToken);
    }
  }

  return {
    user: savedUser,
    accessToken: savedAccessToken,
  };
};

const refreshSession = async (
  authParams: IAuthParams,
  isProduction: boolean
) => {
  const authStorage = getAuthStorage(isProduction);

  const savedAccessToken = authStorage.getItem("accessToken");
  const refreshToken = authStorage.getItem("refreshToken");

  const { clientId, clientSecret, realm } = authParams;

  if (savedAccessToken && realm && clientSecret && clientId && refreshToken) {
    const refreshTokenResponse = await identidadv1Auth.refreshAccessToken(
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
  authParams: IAuthParams,
  isProduction: boolean
) => {
  const { realm } = authParams;

  if (realm) {
    await identidadv1Auth.revokeAccessToken(accessToken, realm);
  }
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
