import { getAuthStorage } from "src/context/config/storage";
import { IAuthParams } from "src/context/types";
import { IUser } from "src/types/user";
import { IRefreshTokenResponse } from "../identidadv1/types";
import { ISessionData } from "../types";
import { iAuthAuth } from "./authorization";

const loginWithRedirect = async (
  authParams: IAuthParams,
  isProduction: boolean
): Promise<void> => {
  const authStorage = getAuthStorage(isProduction);
  authStorage.clear();
  window.history.replaceState({}, "", "/");

  const baseUrl = new URL(iAuthAuth.getServiceUrl(isProduction));

  const url = await iAuthAuth.buildAuthorizationUrl(
    baseUrl,
    authParams,
    isProduction
  );

  window.location.replace(url);
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

    const { originatorId } = authParams;

    window.history.replaceState({}, document.title, window.location.pathname);

    const accessTokenResponse = await iAuthAuth.getAccessToken();

    if (!accessTokenResponse || !originatorId) return;

    const userData = await iAuthAuth.getUserData(
      accessTokenResponse.accessToken,
      originatorId,
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
  }

  return {
    user: savedUser,
    accessToken: savedAccessToken,
  };
};

const refreshSession = async (
  _: IAuthParams,
  isProduction: boolean
): Promise<IRefreshTokenResponse | undefined> => {
  const authStorage = getAuthStorage(isProduction);

  const refreshToken = authStorage.getItem("refreshToken");

  if (!refreshToken) return;

  return Promise.resolve({
    accessToken: refreshToken,
    tokenType: 1,
    expiresIn: "3600",
    refreshToken: refreshToken,
    realm: "default",
  });
};

const logout = async (
  _: string,
  authParams: IAuthParams,
  isProduction: boolean
) => {
  const authStorage = getAuthStorage(isProduction);

  authStorage.removeItem("user");
  authStorage.removeItem("accessToken");
  authStorage.removeItem("refreshToken");
  authStorage.removeItem("expiresIn");

  const baseUrl = new URL(`${iAuthAuth.getServiceUrl(isProduction)}/logout`);

  const url = await iAuthAuth.buildAuthorizationUrl(
    baseUrl,
    authParams,
    isProduction
  );

  window.location.replace(url);
};

const getExpiredTime = (isProduction: boolean): number | null => {
  const authStorage = getAuthStorage(isProduction);

  const expiresIn = authStorage.getItem("expiresIn");

  return expiresIn ? Number(expiresIn) : null;
};

const iAuthRepository = {
  loginWithRedirect,
  validateSession,
  refreshSession,
  logout,
  getExpiredTime,
};

export { iAuthRepository };
