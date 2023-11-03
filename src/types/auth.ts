interface IAuthConfig {
  clientId: string;
  clientSecret: string;
  realm: string;
  redirectUri: string;
  scopes?: string[];
}

export type { IAuthConfig };
