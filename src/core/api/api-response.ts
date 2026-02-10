import { serialize } from "superjson";


export class AppError extends Error {
  public statusCode: number;
  public details?: any;
  public status: string;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

type PrismaError = {
  code?: string;
  message: string;
  meta?: {
    target?: string[] | string;
  };
  name?: string;
};


function isPrismaKnownRequestError(error: any): error is PrismaError {
  return (
    typeof error === "object" &&
    error !== null &&
    typeof error.code === "string" &&
    error.name === "PrismaClientKnownRequestError"
  );
}

function isPrismaValidationError(error: any): boolean {
  return error?.name === "PrismaClientValidationError";
}

function isPrismaInitializationError(error: any): boolean {
  return error?.name === "PrismaClientInitializationError";
}

function isPrismaRustPanicError(error: any): boolean {
  return error?.name === "PrismaClientRustPanicError";
}


export function formatPrismaError(error: unknown): AppError {
  // ✅ Prisma known errors
  if (isPrismaKnownRequestError(error)) {
    switch (error.code) {
      case "P2002": {
        const target = error.meta?.target;
        const fields = Array.isArray(target)
          ? target.join("، ")
          : typeof target === "string"
          ? target
          : "فیلد نامشخص";

        return new AppError(
          `مقداری که وارد کرده‌اید در فیلد(های) ${fields} تکراری است. لطفاً مقدار متفاوتی وارد کنید.`,
          400
        );
      }

      case "P2025":
        return new AppError(
          "رکورد مورد نظر یافت نشد. احتمالاً این داده قبلاً حذف شده یا اصلاً وجود نداشته است.",
          404
        );

      case "P2003":
        return new AppError(
          "عملیات انجام نشد چون به داده‌ای اشاره شده که وجود ندارد. لطفاً داده‌های وابسته را بررسی کنید.",
          400
        );

      default:
        return new AppError(
          `خطایی در پایگاه داده رخ داده است (کد خطا: ${error.code}). لطفاً دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.`,
          500
        );
    }
  }

  // ✅ Prisma validation error
  if (isPrismaValidationError(error)) {
    return new AppError(
      `اطلاعات وارد شده معتبر نیستند. لطفاً داده‌ها را بررسی و اصلاح کنید. جزئیات: ${
        (error as Error).message
      }`,
      400
    );
  }

  // ✅ Prisma initialization error
  if (isPrismaInitializationError(error)) {
    return new AppError(
      "ارتباط با پایگاه داده برقرار نشد. لطفاً اتصال سرور را بررسی کنید یا بعداً تلاش کنید.",
      500
    );
  }

  // ✅ Prisma panic error
  if (isPrismaRustPanicError(error)) {
    return new AppError(
      "خطای جدی در پایگاه داده رخ داده است. لطفاً با پشتیبانی تماس بگیرید.",
      500
    );
  }

  // ✅ Generic JS error
  if (error instanceof Error) {
    return new AppError(`خطایی رخ داده است: ${error.message}`, 500);
  }

  // ✅ Unknown fallback
  return new AppError("خطای ناشناخته‌ای رخ داده است.", 500, error);
}


export class ApiResponse<T> {
  constructor(
    public status: "success" | "error",
    public message: string,
    public data?: T,
    public details?: any
  ) {}

  static success<T>(data?: T, message = "با موفقیت انجام شد") {
    const serialized = serialize({ status: "success", message, data });
    return serialized.json;
  }

  static error(message = "خطایی صورت گرفته است", details?: any) {
    const response: any = { status: "error", message, data: null };
    if (details) {
      response.details = details;
    }
    const serialized = serialize(response);
    return serialized.json;
  }

  static custom<T>(
    status: "success" | "error",
    message: string,
    data?: T,
    details?: any
  ) {
    const response: any = { status, message, data };
    if (details) {
      response.details = details;
    }
    const serialized = serialize(response);
    return serialized.json;
  }


  static fromError(error: AppError) {
    return ApiResponse.error(error.message, error.details);
  }
}
