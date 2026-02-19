import { IUser } from "src/types/user";
import { generateCodeChallengePair, generateState } from "../../utils/codes";
import {
  IAccessTokenResponse,
  IAuthorizationCodeResponse,
  IRefreshTokenResponse,
  IRevokeTokenResponse,
} from "./types";

const SERVICE_URL =
  "https://odin.selsacloud.com/linix/v7/da77663b-eeaf-42a0-a093-5efbdb1e54d2/servicio/identidad";

const requestAuthorizationCode = async (
  clientId: string,
  clientSecret: string,
  realm: string,
  redirectUri: string,
  scopes?: string[]
) => {
  try {
    const scope = scopes ? scopes.join(" ") : "openid";
    const bodyParams = new URLSearchParams();
    bodyParams.append("response_type", "code");
    bodyParams.append("response_mode", "query");
    bodyParams.append("state", generateState());
    bodyParams.append("redirect_uri", redirectUri);
    bodyParams.append("client_id", clientId);
    bodyParams.append("client_secret", clientSecret);
    bodyParams.append("redirect", "false");
    bodyParams.append("scope", scope);

    const res = await fetch(`${SERVICE_URL}/oauth2/autorizar`, {
      method: "POST",
      headers: {
        Realm: realm,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: bodyParams.toString(),
    });

    const data = await res.json();

    if (data.state && data.redirect_uri) {
      window.location.replace(data.redirect_uri);
      const authorizationCodeResponse: IAuthorizationCodeResponse = {
        state: data.state,
        redirectUri: data.redirect_uri,
      };
      return authorizationCodeResponse;
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

const getAccessToken = async (
  code: string,
  clientId: string,
  clientSecret: string,
  realm: string,
  redirectUri: string
) => {
  try {
    const codeChallengePair = await generateCodeChallengePair();

    const bodyParams = new URLSearchParams();
    bodyParams.append("redirect_uri", redirectUri);
    bodyParams.append("code", code);
    bodyParams.append("client_id", clientId);
    bodyParams.append("client_secret", clientSecret);
    bodyParams.append("code_verifier", codeChallengePair.codeVerifier);
    bodyParams.append("code_challenge", codeChallengePair.codeChallenge);
    bodyParams.append("code_challenge_method", "S256");
    bodyParams.append("grant_type", "authorization_code");

    const res = await fetch(`${SERVICE_URL}/oauth2/token`, {
      method: "POST",
      headers: {
        Realm: realm,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: bodyParams.toString(),
    });

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

const getUserData = async (accessToken: string, realm: string) => {
  try {
    const res = await fetch(`${SERVICE_URL}/oauth2/token/${realm}/info`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `1/${accessToken}`,
      },
    });

    const data = await res.json();

    let firstName = data.usuario.primerNombre;

    if (data.usuario.segundoNombre) {
      firstName += ` ${data.usuario.segundoNombre}`;
    }

    let lastName = data.usuario.primerApellido;

    if (data.usuario.segundoApellido) {
      lastName += ` ${data.usuario.segundoApellido}`;
    }

    if (data.expires_in && data.idSesion && data.usuario) {
      const userData: IUser = {
        id: data.usuario.id,
        company: data.usuario.repositorio,
        email: data.usuario.correoElectronico,
        firstName,
        lastName,
        identification: data.usuario.identificacion,
        phone: data.usuario.telefonoMovil,
        type: data.usuario.tipo,
      };

      return userData;
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

const refreshAccessToken = async (
  accessToken: string,
  realm: string,
  clientId: string,
  clientSecret: string,
  refreshToken: string
) => {
  try {
    const bodyParams = new URLSearchParams();
    bodyParams.append("client_id", clientId);
    bodyParams.append("grant_type", "refresh_token");
    bodyParams.append("refresh_token", refreshToken);
    bodyParams.append("client_secret", clientSecret);

    const res = await fetch(`${SERVICE_URL}/oauth2/token/${realm}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: bodyParams.toString(),
    });

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

const identidadv1Auth = {
  getAccessToken,
  refreshAccessToken,
  requestAuthorizationCode,
  revokeAccessToken,
  getUserData,
};

export { identidadv1Auth };
