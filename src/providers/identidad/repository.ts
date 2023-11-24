import { IUser } from "src/types/user";
import {
  getAccessToken,
  getAuthorizationCode,
  requestAuthorizationCode,
  verifyAccessToken,
} from "./authorization";

const loginWithRedirect = async (
  options: Record<string, any>
): Promise<IUser | undefined> => {
  const { clientId, clientSecret, realm, authorizationParams } = options;

  if (!clientSecret || !realm) return;

  const { redirectUri, scope } = authorizationParams;
  const { authorizationCode, state } = getAuthorizationCode();

  if (!authorizationCode || !state) {
    requestAuthorizationCode(clientId, clientSecret, realm, redirectUri, scope);
    return;
  }

  const accessToken = await getAccessToken(
    authorizationCode,
    clientId,
    clientSecret,
    realm,
    redirectUri
  );

  if (!accessToken) return;

  const verificationData = await verifyAccessToken(accessToken.token, realm);

  if (!verificationData) return;

  return verificationData.user;
};

const identidadRepository = {
  loginWithRedirect,
};

export { identidadRepository };
