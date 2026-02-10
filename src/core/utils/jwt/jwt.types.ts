import type { User } from "@prisma/client";
import type { JWTPayload } from "jose";

/** Token kind: determines expiry and optional secret */
export type TokenKind = "access" | "refresh" | "otp";

/** Base session: userId + role (used by access and refresh) */
export interface Payload {
  userId: User["id"];
  role: User["role"];
}

/** Access token payload (short-lived, API auth). Legacy-compatible. */
export interface AccessPayload extends Payload {
  kind: "access";
}

/** Refresh token payload (long-lived, include optional ingest for audit) */
export interface RefreshPayload extends Payload {
  kind: "refresh";
  /** DB token id for revocation */
  tokenId?: bigint;
  device?: string;
  /** Extra ingest/metadata (e.g. ip, userAgent) */
  meta?: Record<string, string>;
}

/** OTP token purpose (e.g. after login, password reset, verify phone) */
export type OtpPurpose = "login" | "verify_phone" | "reset_password" | "email_verify" | string;

/** OTP token payload (short-lived, purpose + subject + metadata) */
export interface OtpPayload {
  kind: "otp";
  purpose: OtpPurpose;
  /** Subject: phone number or userId (string for flexibility) */
  subject: string;
  /** Where to redirect after successful OTP verification */
  redirectUrl?: string;
  /** Ingest/metadata (device, ip, requestedAt, etc.) */
  meta?: Record<string, unknown>;
}

/** Any signed payload (discriminated by kind) */
export type AnyPayload = AccessPayload | RefreshPayload | OtpPayload;

/** Session payload as returned from verify (extends jose JWTPayload for iat/exp) */
export interface SessionPayload extends JWTPayload {
  userId: User["id"];
  role: User["role"];
  kind?: TokenKind;
}
