/**
 * Authentication-related constants
 */
export const AUTH_PARAMS = {
  AUTH_TOKEN: "auth_token",
  REFRESH_TOKEN: "refresh_token",
  RETURN_URL: "return_url",
} as const;

export const AUTH_ERRORS = {
  INVALID_TOKEN: "invalid_token",
  TOKEN_EXPIRED: "token_expired",
  NETWORK_ERROR: "network_error",
} as const;

/**
 * Minimum token length for validation
 */
export const MIN_TOKEN_LENGTH = 10;
