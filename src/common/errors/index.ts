import { AppError } from "@/core/api/api-response";


type ErrorDefinition = readonly [message: string, statusCode: number];


const ErrorDefinitions = {
  // HTTP Status Errors
  Http: {
    BadRequest: ["درخواست نامعتبر است.", 400] as const,
    Unauthorized: ["برای دسترسی به این بخش باید وارد شوید.", 401] as const,
    Forbidden: ["شما اجازه دسترسی به این بخش را ندارید.", 403] as const,
    NotFound: ["موردی یافت نشد.", 404] as const,
    Conflict: ["درخواست با داده‌های موجود در تضاد است.", 409] as const,
    Timeout: ["درخواست بیش از حد طول کشید.", 408] as const,
    TooManyRequests: ["تعداد درخواست‌ها بیش از حد مجاز است.", 429] as const,
    Internal: ["خطای داخلی سرور رخ داده است.", 500] as const,
  },

  // Authentication & Authorization Errors
  Auth: {
    Unauthorized: ["برای دسترسی به این بخش باید وارد شوید.", 401] as const,
    Forbidden: ["شما اجازه دسترسی به این بخش را ندارید.", 403] as const,
    TokenExpired: ["توکن شما منقضی شده است.", 401] as const,
    TokenInvalid: ["توکن نامعتبر است.", 401] as const,
    UserBanned: ["حساب کاربری شما مسدود شده است.", 403] as const,
    UserNotVerified: ["حساب کاربری شما تایید نشده است.", 403] as const,
    UserInactive: ["حساب کاربری شما غیرفعال است.", 403] as const,
    WrongCredentials: ["نام کاربری یا رمز عبور اشتباه است.", 401] as const,
    TooManyOtpAttempts: [
      "تعداد تلاش‌های ورود کد بیش از حد مجاز است. لطفاً درخواست کد جدید دهید.",
      429,
    ] as const,
  },

  // Validation Errors
  Validation: {
    Invalid: ["داده‌های وارد شده معتبر نیستند.", 400] as const,
    MissingField: ["فیلدهای اجباری وارد نشده‌اند.", 400] as const,
    InvalidFormat: ["فرمت داده وارد شده صحیح نیست.", 400] as const,
    WrongCode: ["کد وارد شده معتبر نیست.", 400] as const,
  },

  // Resource Errors
  Resource: {
    NotFound: ["موردی یافت نشد.", 404] as const,
    AlreadyExists: ["این مورد قبلاً وجود دارد.", 409] as const,
    Conflict: ["درخواست با داده‌های موجود در تضاد است.", 409] as const,
    Deleted: ["این مورد قبلاً حذف شده است.", 404] as const,
  },

  // Business Logic Errors
  Business: {
    InsufficientPermissions: [
      "شما اجازه انجام این عملیات را ندارید.",
      403,
    ] as const,
    OperationNotAllowed: ["این عملیات مجاز نیست.", 403] as const,
    InvalidState: [
      "وضعیت فعلی اجازه انجام این عملیات را نمی‌دهد.",
      400,
    ] as const,
  },

  // Database Errors
  Database: {
    ConnectionFailed: [
      "ارتباط با پایگاه داده برقرار نشد. لطفاً بعداً تلاش کنید.",
      500,
    ] as const,
    QueryFailed: [
      "خطایی در اجرای درخواست پایگاه داده رخ داده است.",
      500,
    ] as const,
    UnknownError: [
      "خطای ناشناخته‌ای در پایگاه داده رخ داده است.",
      500,
    ] as const,
    RecordNotFound: [
      "رکورد مورد نظر یافت نشد. احتمالاً این داده قبلاً حذف شده یا اصلاً وجود نداشته است.",
      404,
    ] as const,
    ForeignKeyConstraint: [
      "عملیات انجام نشد چون به داده‌ای اشاره شده که وجود ندارد. لطفاً داده‌های وابسته را بررسی کنید.",
      400,
    ] as const,
    UniqueConstraint: [
      "این مقدار قبلاً در سیستم ثبت شده است. لطفاً مقدار دیگری انتخاب کنید.",
      409,
    ] as const,
    ValidationFailed: [
      "اطلاعات وارد شده معتبر نیستند. لطفاً داده‌ها را بررسی و اصلاح کنید.",
      400,
    ] as const,
  },
} as const;

/** Union of every ErrorDefinitions entry for typed autocomplete (e.g. in checkExist). */
type Values<T> = T[keyof T];
type DeepValues<T> = T extends readonly [string, number] ? T : T extends object ? DeepValues<Values<T>> : never;
export type AnyErrorDefinition = DeepValues<typeof ErrorDefinitions>;

export const Errors = {
  NotFound: ErrorDefinitions.Resource.NotFound,
  BadRequest: ErrorDefinitions.Http.BadRequest,
  Unauthorized: ErrorDefinitions.Auth.Unauthorized,
  Forbidden: ErrorDefinitions.Auth.Forbidden,
  Internal: ErrorDefinitions.Http.Internal,
  Conflict: ErrorDefinitions.Resource.Conflict,
  Validation: ErrorDefinitions.Validation.Invalid,
  Timeout: ErrorDefinitions.Http.Timeout,
  TooManyRequests: ErrorDefinitions.Http.TooManyRequests,
  WrongCode: ErrorDefinitions.Validation.WrongCode,
} as const;


export function createError(
  definition: ErrorDefinition,
  details?: any
): AppError {
  const [message, statusCode] = definition;
  return new AppError(message, statusCode, details);
}


export function createErrorWithMessage(
  definition: ErrorDefinition,
  customMessage: string,
  details?: any
): AppError {
  const [, statusCode] = definition;
  return new AppError(customMessage, statusCode, details);
}


export { ErrorDefinitions };
