/** When true (default), skip the login screen. Set VITE_DISABLE_AUTH=false for LAN deployments. */
export const DISABLE_AUTH = import.meta.env.VITE_DISABLE_AUTH !== 'false';

export const AUTH_TOKEN_KEY = 'orca_auth_token';
