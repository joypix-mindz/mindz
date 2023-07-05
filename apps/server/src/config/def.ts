import type { ApolloDriverConfig } from '@nestjs/apollo';

import type { LeafPaths } from '../utils/types';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace globalThis {
    // eslint-disable-next-line no-var
    var AFFiNE: AFFiNEConfig;
  }
}

export enum ExternalAccount {
  github = 'github',
  google = 'google',
  firebase = 'firebase',
}

type EnvConfigType = 'string' | 'int' | 'float' | 'boolean';
type ConfigPaths = LeafPaths<
  Omit<
    AFFiNEConfig,
    | 'ENV_MAP'
    | 'version'
    | 'baseUrl'
    | 'origin'
    | 'prod'
    | 'dev'
    | 'test'
    | 'deploy'
  >,
  '',
  '....'
>;
/**
 * parse number value from environment variables
 */
function int(value: string) {
  const n = parseInt(value);
  return Number.isNaN(n) ? undefined : n;
}

function float(value: string) {
  const n = parseFloat(value);
  return Number.isNaN(n) ? undefined : n;
}

function boolean(value: string) {
  return value === '1' || value.toLowerCase() === 'true';
}

export function parseEnvValue(value: string | undefined, type?: EnvConfigType) {
  if (typeof value === 'undefined') {
    return;
  }

  return type === 'int'
    ? int(value)
    : type === 'float'
    ? float(value)
    : type === 'boolean'
    ? boolean(value)
    : value;
}

/**
 * All Configurations that would control AFFiNE server behaviors
 *
 */
export interface AFFiNEConfig {
  ENV_MAP: Record<string, ConfigPaths | [ConfigPaths, EnvConfigType?]>;
  /**
   * Server Identity
   */
  readonly serverId: string;
  /**
   * System version
   */
  readonly version: string;
  /**
   * alias to `process.env.NODE_ENV`
   *
   * @default 'production'
   * @env NODE_ENV
   */
  readonly env: string;
  /**
   * fast environment judge
   */
  get prod(): boolean;
  get dev(): boolean;
  get test(): boolean;
  get deploy(): boolean;

  /**
   * Whether the server is hosted on a ssl enabled domain
   */
  https: boolean;
  /**
   * where the server get deployed.
   *
   * @default 'localhost'
   * @env AFFINE_SERVER_HOST
   */
  host: string;
  /**
   * which port the server will listen on
   *
   * @default 3010
   * @env AFFINE_SERVER_PORT
   */
  port: number;
  /**
   * subpath where the server get deployed if there is.
   *
   * @default '' // empty string
   * @env AFFINE_SERVER_SUB_PATH
   */
  path: string;

  /**
   * Readonly property `baseUrl` is the full url of the server consists of `https://HOST:PORT/PATH`.
   *
   * if `host` is not `localhost` then the port will be ignored
   */
  get baseUrl(): string;

  /**
   * Readonly property `origin` is domain origin in the form of `https://HOST:PORT` without subpath.
   *
   * if `host` is not `localhost` then the port will be ignored
   */
  get origin(): string;

  /**
   * the database config
   */
  db: {
    url: string;
  };

  /**
   * the apollo driver config
   */
  graphql: ApolloDriverConfig;
  /**
   * object storage Config
   *
   * all artifacts and logs will be stored on instance disk,
   * and can not shared between instances if not configured
   */
  objectStorage: {
    /**
     * whether use remote object storage
     */
    r2: {
      enabled: boolean;
      accountId: string;
      bucket: string;
      accessKeyId: string;
      secretAccessKey: string;
    };
    /**
     * Only used when `enable` is `false`
     */
    fs: {
      path: string;
    };
  };

  /**
   * authentication config
   */
  auth: {
    /**
     * Application access token expiration time
     */
    readonly accessTokenExpiresIn: number;
    /**
     * Application refresh token expiration time
     */
    readonly refreshTokenExpiresIn: number;
    /**
     * Add some leeway (in seconds) to the exp and nbf validation to account for clock skew.
     * Defaults to 60 if omitted.
     */
    readonly leeway: number;
    /**
     * Application public key
     *
     */
    readonly publicKey: string;
    /**
     * Application private key
     *
     */
    readonly privateKey: string;
    /**
     * whether allow user to signup with email directly
     */
    enableSignup: boolean;
    /**
     * whether allow user to signup by oauth providers
     */
    enableOauth: boolean;
    /**
     * NEXTAUTH_SECRET
     */
    nextAuthSecret: string;
    /**
     * all available oauth providers
     */
    oauthProviders: Partial<
      Record<
        ExternalAccount,
        {
          enabled: boolean;
          clientId: string;
          clientSecret: string;
          /**
           * uri to start oauth flow
           */
          authorizationUri?: string;
          /**
           * uri to authenticate `access_token` when user is redirected back from oauth provider with `code`
           */
          accessTokenUri?: string;
          /**
           * uri to get user info with authenticated `access_token`
           */
          userInfoUri?: string;
          args?: Record<string, any>;
        }
      >
    >;
    email: {
      server: string;
      port: number;
      sender: string;
      password: string;
    };
  };
}
