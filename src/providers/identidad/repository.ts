import {
  getAccessToken,
  getAuthorizationCode,
  requestAuthorizationCode,
  verifyAccessToken,
} from "./authorization";

const loginWithRedirect = async (
  options: Record<string, any>
): Promise<void> => {
  const { clientId, clientSecret, realm, authorizationParams } = options;

  if (!clientSecret || !realm) return;

  const { redirectUri, scope } = authorizationParams;

  await requestAuthorizationCode(
    clientId,
    clientSecret,
    realm,
    redirectUri,
    scope
  );
};

const validateSession = async (options: Record<string, any>) => {
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

  return {
    ...sessionData,
    refreshToken: accessTokenResponse.refreshToken,
  };
};

const identidadRepository = {
  loginWithRedirect,
  validateSession,
};

export { identidadRepository };
