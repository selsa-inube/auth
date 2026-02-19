import { jwtDecode } from "jwt-decode";
import { getAuthStorage } from "src/context/config/storage";
import { IAuthParams } from "src/context/types";
import { IUser } from "src/types/user";
import { generateCodeChallengePair, generateState } from "../../utils/codes";
import { IAccessTokenResponse, IDecodedData } from "./types";

const getServiceUrl = (isProduction: boolean) => {
  return isProduction
    ? "https://iauth.inube.cloud"
    : "https://iauth.inube.online";
};

const getApiUrl = (isProduction: boolean) => {
  return isProduction
    ? "https://iauth.persistence.process.inube.pro/iauth-persistence-process-service/api"
    : "https://four.external.iauth.persistence.process.inube.dev/iauth-persistence-process-service/api";
};

const buildAuthorizationUrl = async (
  url: URL,
  authParams: IAuthParams,
  isProduction: boolean
) => {
  const { originatorId, redirectUri, applicationName } = authParams;

  if (!originatorId || !redirectUri || !applicationName) {
    throw new Error(
      "Missing required parameters: originatorId, redirectUri and applicationName"
    );
  }

  const { codeChallenge, codeVerifier } = await generateCodeChallengePair();

  const authStorage = getAuthStorage(isProduction);
  authStorage.setItem("pkce_code_verifier", codeVerifier);

  url.searchParams.set("originatorId", originatorId);
  url.searchParams.set("callbackUrl", redirectUri);
  url.searchParams.set("state", generateState());
  url.searchParams.set("codeChallenge", codeChallenge);
  url.searchParams.set("applicationName", applicationName);
  url.searchParams.set("externalFlow", "false");

  return url;
};

const getAccessToken = async () => {
  try {
    const url = new URL(window.location.href);
    const urlParams = url.searchParams;
    const accessToken = urlParams.get("ac");
    const errorParam = urlParams.get("error");
    const errorDescription = urlParams.get("error_description");

    if (errorParam) {
      throw new Error(`Error: ${errorParam}, Description: ${errorDescription}`);
    }

    if (accessToken) {
      const accessTokenResponse: IAccessTokenResponse = {
        accessToken: accessToken,
        expiresIn: "8.64e7",
        refreshToken: accessToken,
      };

      return accessTokenResponse;
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

const getUserData = async (
  accessToken: string,
  originatorId: string,
  isProduction: boolean
) => {
  try {
    const authStorage = getAuthStorage(isProduction);
    const codeVerifier = authStorage.getItem("pkce_code_verifier");

    if (!codeVerifier) {
      throw new Error("PKCE code verifier not found in storage");
    }

    const apiUrl = `${getApiUrl(
      isProduction
    )}/user-accounts/authentication-token`;

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "X-Action": "UserAuthenticationToken",
        "Content-Type": "application/json",
        "X-Originator-Code": originatorId,
        Accept: "application/json",
      },
      body: JSON.stringify({
        authorizationValue: accessToken,
        codeVerifier: codeVerifier,
      }),
    });

    const data = await res.json();
    const decodedData = jwtDecode<IDecodedData>(data.idToken);

    if (decodedData) {
      const userData: IUser = {
        id: decodedData.identificationNumber || "",
        company: decodedData.consumerApplicationCode || "",
        firstName: decodedData.names || "",
        lastName: decodedData.surNames || "",
        identification: decodedData.identificationNumber || "",
      };

      return userData;
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

const iAuthAuth = {
  buildAuthorizationUrl,
  getServiceUrl,
  getAccessToken,
  getUserData,
};

export { iAuthAuth };
