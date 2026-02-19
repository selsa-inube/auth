interface IAuthorizationCodeResponse {
  state: string;
  redirectUri: string;
}

interface IAccessTokenResponse {
  accessToken: string;
  tokenType: number;
  expiresIn: string;
  refreshToken: string;
  realm: string;
}

interface IRefreshTokenResponse {
  accessToken: string;
  tokenType: number;
  expiresIn: string;
  refreshToken: string;
  realm: string;
}

interface IRevokeTokenResponse {
  accessToken: string;
}

export type {
  IAccessTokenResponse,
  IAuthorizationCodeResponse,
  IRefreshTokenResponse,
  IRevokeTokenResponse,
};
