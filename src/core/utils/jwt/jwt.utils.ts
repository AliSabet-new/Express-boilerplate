import { decodeJwt, jwtVerify, SignJWT } from "jose";
import { serialize, deserialize } from "superjson";

import {
  SECRET,
  REFRESH_SECRET,
  OTP_SECRET,
  JWT_ALGORITHM,
  JWT_ACCESS_EXPIRES_IN,
  JWT_ACCESS_EXPIRES_IN_MS,
  JWT_REFRESH_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN_MS,
  JWT_OTP_EXPIRES_IN,
  JWT_OTP_EXPIRES_IN_MS,
} from "@/common";
import type { User } from "@prisma/client";
import type {
  TokenKind,
  Payload,
  AccessPayload,
  RefreshPayload,
  OtpPayload,
  AnyPayload,
  SessionPayload,
} from "@/core/utils/jwt/jwt.types";

const KIND_CONFIG: Record<TokenKind, { secret: Uint8Array; expiresIn: string; expiresInMs: number }> = {
  access: {
    secret: SECRET,
    expiresIn: JWT_ACCESS_EXPIRES_IN,
    expiresInMs: JWT_ACCESS_EXPIRES_IN_MS,
  },
  refresh: {
    secret: REFRESH_SECRET,
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    expiresInMs: JWT_REFRESH_EXPIRES_IN_MS,
  },
  otp: {
    secret: OTP_SECRET,
    expiresIn: JWT_OTP_EXPIRES_IN,
    expiresInMs: JWT_OTP_EXPIRES_IN_MS,
  },
};

export class JwtUtil {
  private readonly algorithm = JWT_ALGORITHM as "HS256";

  async create(payload: Payload): Promise<string>;
  async create(payload: AnyPayload, kind: TokenKind): Promise<string>;
  async create(payload: AnyPayload | Payload, kind?: TokenKind): Promise<string> {
    const k = kind ?? "access";
    const withKind = "kind" in payload ? payload : { ...payload, kind: k };
    return this.sign(withKind as AnyPayload, k);
  }

  private async sign(payload: AnyPayload, kind: TokenKind): Promise<string> {
    const config = KIND_CONFIG[kind];
    const withKind = { ...payload, kind };
    const serialized = serialize(withKind);
    const jwtPayload = serialized.json as Record<string, unknown>;

    return new SignJWT(jwtPayload)
      .setIssuedAt()
      .setExpirationTime(config.expiresIn)
      .setProtectedHeader({ alg: this.algorithm })
      .sign(config.secret);
  }

  async createAccessToken(payload: Payload): Promise<string> {
    return this.sign({ ...payload, kind: "access" }, "access");
  }

  async createRefreshToken(
    payload: RefreshPayload | (Omit<RefreshPayload, "kind"> & { kind?: "refresh" }),
  ): Promise<string> {
    return this.sign({ ...payload, kind: "refresh" }, "refresh");
  }

  async createOtpToken(payload: Omit<OtpPayload, "kind">): Promise<string> {
    return this.sign({ ...payload, kind: "otp" }, "otp");
  }

  async verify(session: string | undefined): Promise<AnyPayload | SessionPayload | { error: string }> {
    try {
      if (!session) {
        return { error: "مقدار توکن خالی ارسال شده است !!" };
      }

      let kind: TokenKind = "access";
      try {
        const decoded = decodeJwt(session);
        kind = (decoded.kind as TokenKind) || "access";
        if (!KIND_CONFIG[kind]) kind = "access";
      } catch {
        return { error: "مقدار توکن نامعتبر است" };
      }

      const config = KIND_CONFIG[kind];
      const { payload } = await jwtVerify<Record<string, unknown>>(session, config.secret, {
        algorithms: [this.algorithm],
        maxTokenAge: config.expiresInMs,
      });

      if (!payload) return { error: "مقدار توکن نامعتبر است" };

      const deserialized = deserialize({
        json: payload as Parameters<typeof deserialize>[0]["json"],
      }) as SessionPayload & Partial<AnyPayload>;
      return deserialized;
    } catch {
      return { error: "مقدار توکن نامعتبر یا منقضی شده است" };
    }
  }

  async verifyAccess(session: string | undefined): Promise<AccessPayload | { error: string }> {
    const result = await this.verify(session);
    if ("error" in result) return result as { error: string };
    if (result.kind && result.kind !== "access") {
      return { error: "نوع توکن نامعتبر است" };
    }
    return {
      kind: "access",
      userId: result.userId as User["id"],
      role: result.role as User["role"],
    } as AccessPayload;
  }

  async verifyRefresh(session: string | undefined): Promise<RefreshPayload | { error: string }> {
    const result = await this.verify(session);
    if ("error" in result) return result as { error: string };
    if (result.kind && result.kind !== "refresh") {
      return { error: "نوع توکن نامعتبر است" };
    }
    const r = result as RefreshPayload;
    return {
      kind: "refresh",
      userId: r.userId,
      role: r.role,
      tokenId: r.tokenId,
      device: r.device,
      meta: r.meta,
    } as RefreshPayload;
  }

  async verifyOtp(session: string | undefined): Promise<OtpPayload | { error: string }> {
    const result = await this.verify(session);
    if ("error" in result) return result as { error: string };
    if (result.kind && result.kind !== "otp") {
      return { error: "نوع توکن نامعتبر است" };
    }
    const o = result as OtpPayload;
    return {
      kind: "otp",
      purpose: o.purpose,
      subject: o.subject,
      redirectUrl: o.redirectUrl,
      meta: o.meta,
    } as OtpPayload;
  }
}

export const jwtUtilInstance = new JwtUtil();
