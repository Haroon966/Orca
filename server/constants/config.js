/**
 * Environment Flag: Is Platform
 * Indicates if the app is running in Platform mode (hosted) or OSS mode (self-hosted)
 */
export const IS_PLATFORM = process.env.VITE_IS_PLATFORM === 'true';

/**
 * Skip login UI and JWT checks for trusted local use (ClaudeUI default).
 * Set DISABLE_AUTH=false when exposing the server on a network.
 */
export const DISABLE_AUTH = process.env.DISABLE_AUTH === 'true';

/** True when API/WebSocket auth is bypassed (platform hosting or local no-login mode). */
export const AUTH_BYPASS = IS_PLATFORM || DISABLE_AUTH;