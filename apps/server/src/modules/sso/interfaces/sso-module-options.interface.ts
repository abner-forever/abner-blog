export interface SSOModuleOptions {
  /** Keycloak issuer URL, e.g. http://localhost:8082/realms/abner-blog */
  issuerUrl: string;

  /** OIDC client ID */
  clientId: string;

  /** OIDC client secret (confidential client) */
  clientSecret: string;

  /** BFF callback URL, e.g. http://localhost:8080/api/sso/callback */
  callbackUrl: string;

  /** Session TTL in seconds (default: 28800 = 8 hours) */
  sessionTtlSeconds?: number;

  /** Cookie domain for cross-subdomain sharing (optional) */
  cookieDomain?: string;

  /** Whether to set Secure flag on cookie (default: false in dev) */
  cookieSecure?: boolean;

  /** Whether to auto-provision local user when no mapping found (default: true) */
  autoProvision?: boolean;

  /** Default role for auto-provisioned users (default: 'admin') */
  defaultRole?: string;
}
