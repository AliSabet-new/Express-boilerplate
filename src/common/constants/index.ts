export const JWT_SECRET = process.env.JWT_SECRET || "";
export const JWT_ALGORITHM = process.env.JWT_ALGORITHM || "HS256";

/** Default secret (used for access + OTP if no dedicated secret set) */
export const SECRET = new TextEncoder().encode(JWT_SECRET);

/** Optional stronger secret for refresh tokens */
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || "";
export const REFRESH_SECRET = new TextEncoder().encode(JWT_REFRESH_SECRET);

/** Optional secret for OTP tokens (e.g. short-lived verify links) */
const JWT_OTP_SECRET = process.env.JWT_OTP_SECRET || process.env.JWT_SECRET || "";
export const OTP_SECRET = new TextEncoder().encode(JWT_OTP_SECRET);

// ─── Legacy (single token) – prefer token-kind constants below ─────────────
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";
export const JWT_EXPIRES_IN_MS = 1000 * 60 * 60 * 24 * 30;

// ─── Access token (short-lived, API auth) ───────────────────────────────────
export const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "15m";
export const JWT_ACCESS_EXPIRES_IN_MS = parseExpiryToMs(JWT_ACCESS_EXPIRES_IN);

// ─── Refresh token (long-lived, obtain new access) ──────────────────────────
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || "30d";
export const JWT_REFRESH_EXPIRES_IN_MS = parseExpiryToMs(JWT_REFRESH_EXPIRES_IN);

// ─── OTP / one-time tokens (short-lived, e.g. post-login, verify) ────────────
export const JWT_OTP_EXPIRES_IN = process.env.JWT_OTP_EXPIRES_IN || "15m";
export const JWT_OTP_EXPIRES_IN_MS = parseExpiryToMs(JWT_OTP_EXPIRES_IN);

function parseExpiryToMs(expiry: string): number {
  const match = expiry.match(/^(\d+)(m|h|d|s)$/);
  if (!match) return 1000 * 60 * 15; // default 15 min
  const [, n, unit] = match;
  const num = parseInt(n!, 10);
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return num * (multipliers[unit!] ?? 60 * 1000);
}

export const PORT = process.env.PORT || (4000 as const);
export const NODE_ENV = process.env.NODE_ENV || "development";

export const FARAZ_SMS_OTP_PATTERN_ID = process.env.FARAZ_SMS_OTP_PATTERN_ID || "";
export const FARAZ_SMS_API_KEY = process.env.FARAZ_SMS_API_KEY || "";
export const FARAZ_SMS_NUMBER1 = process.env.FARAZ_SMS_NUMBER1 || "";
export const FARAZ_SMS_NUMBER2 = process.env.FARAZ_SMS_NUMBER2 || "";
export const FARAZ_SMS_BASE_URL = process.env.FARAZ_SMS_BASE_URL || "";

export const DATABASE_HOST = process.env.DATABASE_HOST || "";
export const DATABASE_PORT = process.env.DATABASE_PORT || "";
export const DATABASE_USERNAME = process.env.DATABASE_USERNAME || "";
export const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD || "";
export const DATABASE_NAME = process.env.DATABASE_NAME || "";

export const DATABASE_URL = process.env.DATABASE_URL || "";

export const MAX_OTP_TRY = 5 as const;

export const IMAGE_SIZES = {
  SMALL: { height: 96, width: 96, fit: "cover" as const },
  MEDIUM: { height: 192, width: 192, fit: "cover" as const },
  LARGE: { height: 512, width: 512, fit: "cover" as const },
} as const;
