interface IAccessTokenResponse {
  accessToken: string;
  expiresIn: string;
  refreshToken: string;
}

interface IDecodedData {
  identificationNumber: string;
  identificationType: string;
  names: string;
  surNames: string;
  userAccount: string;
  consumerApplicationCode: string;
}

export type { IAccessTokenResponse, IDecodedData };
