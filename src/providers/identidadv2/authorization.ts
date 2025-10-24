import { getAuthorizationCode } from "src/utils/params";
import { generateCodeChallengePair, generateState } from "../../utils/codes";
import { ISessionData } from "../types";

const SERVICE_URL = "https://dev.selsacloud.com/identidad/v2/api";

const requestAuthorizationCode = async (
  clientId: string,
  realm: string,
  redirectUri: string,
  scopes: string[] = [
    "openid",
    "email",
    "profile",
    "address",
    "phone",
    "identityDocument",
  ],
  accessType: "online" | "offline" = "online"
) => {
  try {
    const { codeChallenge, codeVerifier } = await generateCodeChallengePair();
    const state = generateState();

    sessionStorage.setItem("pkce_code_verifier", codeVerifier);
    sessionStorage.setItem("oauth_state", state);

    const params = new URLSearchParams({
      protocol: "oauth2",
      response_type: "code",
      client_id: clientId,
      redirect_uri: encodeURI(redirectUri),
      scope: scopes.join(" "),
      state,
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
      access_type: accessType,
      response_mode: "query",
    });

    const authorizationUrl = `${SERVICE_URL}/realms/${realm}/protocols/oauth2/authorize?${params.toString()}`;

    window.location.replace(authorizationUrl);
  } catch (error) {
    console.error("Error building authorization URL:", error);
    throw new Error("Failed to initialize OAuth2 authorization request");
  }
};

interface IAccessTokenResponse {
  accessToken: string;
  tokenType: number;
  expiresIn: string;
  refreshToken: string;
  realm: string;
}

const getAccessToken = async (
  code: string,
  clientId: string,
  clientSecret: string,
  realm: string,
  redirectUri: string
) => {
  try {
    const codeVerifier = sessionStorage.getItem("pkce_code_verifier");

    if (!codeVerifier) {
      throw new Error("PKCE code verifier not found in session storage");
    }

    const bodyParams = new URLSearchParams();
    bodyParams.append("grant_type", "authorization_code");
    bodyParams.append("code", code);
    bodyParams.append("redirect_uri", redirectUri);
    bodyParams.append("code_verifier", codeVerifier);

    const basicAuth = btoa(`${clientId}:${clientSecret}`);

    const res = await fetch(
      `${SERVICE_URL}/realms/${realm}/protocols/oauth2/token`,
      {
        method: "POST",
        headers: {
          Realm: realm,
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
        body: bodyParams.toString(),
      }
    );

    const data = await res.json();

    if (
      data.access_token &&
      data.token_type &&
      data.refresh_token &&
      data.realm
    ) {
      const accessTokenResponse: IAccessTokenResponse = {
        accessToken: data.access_token,
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        refreshToken: data.refresh_token,
        realm: data.realm,
      };

      return accessTokenResponse;
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

const verifyAccessToken = async (accessToken: string, realm: string) => {
  try {
    const res = await fetch(
      `${SERVICE_URL}/realms/${realm}/protocols/oauth2/userinfo`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await res.json();

    if (data && data.email && data.name) {
      const sessionData: ISessionData = {
        expiresIn: 0,
        idSesion: "",
        accessToken,
        user: {
          id: data.identityDocument || "",
          company: "",
          email: data.email,
          firstName: data.given_name || "",
          lastName: data.family_name || "",
          identification: data.identityDocument || "",
          phone: data.mobile_phone || "",
          type: "",
        },
      };

      return sessionData;
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

interface IRefreshTokenResponse {
  accessToken: string;
  tokenType: number;
  expiresIn: string;
  refreshToken: string;
  realm: string;
}

const refreshAccessToken = async (
  realm: string,
  clientId: string,
  clientSecret: string,
  refreshToken: string
) => {
  try {
    const bodyParams = new URLSearchParams();
    bodyParams.append("grant_type", "refresh_token");
    bodyParams.append("refresh_token", refreshToken);

    const basicAuth = btoa(`${clientId}:${clientSecret}`);

    const res = await fetch(
      `${SERVICE_URL}/realms/${realm}/protocols/oauth2/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          Authorization: `Basic ${basicAuth}`,
        },
        body: bodyParams.toString(),
      }
    );

    const data = await res.json();

    if (data.access_token) {
      const refreshTokenResponse: IRefreshTokenResponse = {
        expiresIn: data.expires_in,
        accessToken: data.access_token,
        tokenType: data.token_type,
        refreshToken: data.refresh_token,
        realm: data.realm,
      };

      return refreshTokenResponse;
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

interface IRevokeTokenResponse {
  accessToken: string;
}

const revokeAccessToken = async (accessToken: string, realm: string) => {
  try {
    const res = await fetch(`${SERVICE_URL}/oauth2/token/${realm}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `1/${accessToken}`,
      },
    });

    const data = await res.json();

    if (data.access_token) {
      const revokeTokenResponse: IRevokeTokenResponse = {
        accessToken: data.access_token,
      };

      return revokeTokenResponse;
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

export {
  getAccessToken,
  getAuthorizationCode,
  refreshAccessToken,
  requestAuthorizationCode,
  revokeAccessToken,
  verifyAccessToken,
};

export type { IRefreshTokenResponse };
