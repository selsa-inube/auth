import { getAuthStorage } from "src/context/config/storage";
import { IAuthParams } from "src/context/types";
import { IUser } from "src/types/user";
import { getAuthorizationCode } from "src/utils/params";
import { ISessionData } from "../types";
import { identidadv2Auth } from "./authorization";

const loginWithRedirect = async (
  authParams: IAuthParams,
  isProduction: boolean
): Promise<void> => {
  const { clientId, clientSecret, realm, redirectUri, scope } = authParams;

  if (!clientSecret || !realm || !clientId) return;

  await identidadv2Auth.requestAuthorizationCode(
    clientId,
    realm,
    redirectUri,
    scope,
    "online",
    isProduction
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

    const { authorizationCode } = getAuthorizationCode();

    if (!authorizationCode || !clientId || !clientSecret || !realm) return;

    const accessTokenResponse = await identidadv2Auth.getAccessToken(
      authorizationCode,
      clientId,
      clientSecret,
      realm,
      redirectUri,
      isProduction
    );

    if (!accessTokenResponse) return;

    const userData = await identidadv2Auth.getUserData(
      accessTokenResponse.accessToken,
      realm,
      isProduction
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

    window.history.replaceState({}, document.title, window.location.pathname);
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

  const refreshToken = authStorage.getItem("refreshToken");

  const { clientId, clientSecret, realm } = authParams;

  if (realm && clientSecret && clientId && refreshToken) {
    const refreshTokenResponse = await identidadv2Auth.refreshAccessToken(
      realm,
      clientId,
      clientSecret,
      refreshToken,
      isProduction
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
    await identidadv2Auth.revokeAccessToken(accessToken, realm, isProduction);
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

const hasRedirectLogout = false;

const identidadV2Repository = {
  hasRedirectLogout,
  loginWithRedirect,
  validateSession,
  refreshSession,
  logout,
  getExpiredTime,
};

export { identidadV2Repository };
