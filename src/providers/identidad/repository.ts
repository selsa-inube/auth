import {
  ISessionData,
  getAccessToken,
  getAuthorizationCode,
  requestAuthorizationCode,
  verifyAccessToken,
} from "./authorization";

const loginWithRedirect = async (
  options: Record<string, any>
): Promise<ISessionData | undefined> => {
  const { clientId, clientSecret, realm, authorizationParams } = options;

  if (!clientSecret || !realm) return;

  const { redirectUri, scope } = authorizationParams;
  const { authorizationCode, state } = getAuthorizationCode();

  if (!authorizationCode || !state) {
    requestAuthorizationCode(clientId, clientSecret, realm, redirectUri, scope);
    return;
  }

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

  return {
    ...sessionData,
    refreshToken: accessTokenResponse.refreshToken,
  };
};

const identidadRepository = {
  loginWithRedirect,
};

export { identidadRepository };
