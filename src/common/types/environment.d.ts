declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;

      DATABASE_URL: string;
      JWT_REFRESH_TOKEN_SECRET?: string;
      JWT_REFRESH_TOKEN_EXPIRES_IN?: string;
      JWT_ACCESS_TOKEN_SECRET?: string;
      JWT_ACCESS_TOKEN_EXPIRES_IN?: string;
      JWT_REFRESH_TOKEN_SECRET?: string;
      JWT_REFRESH_TOKEN_EXPIRES_IN?: string;
      JWT_OTP_SECRET?: string;
      JWT_OTP_EXPIRES_IN?: string;
      JWT_ALGORITHM?: string;
      JWT_SECRET?: string;
      NODE_ENV?: "development" | "production" | "test";
      FARAZ_SMS_OTP_PATTERN_ID?: string;
      FARAZ_SMS_API_KEY?: string;
      FARAZ_SMS_NUMBER1?: string;
      FARAZ_SMS_NUMBER2?: string;
      FARAZ_SMS_BASE_URL?: string;
      DATABASE_HOST?: string;
      DATABASE_PORT?: string;
      DATABASE_USERNAME?: string;
      DATABASE_PASSWORD?: string;
      DATABASE_NAME?: string;
    }
  }
}

export {};
