import { ErrorDefinitions } from "@/common";
import { AppError } from "@/core/api/api-response";
import { catchAsync } from "@/core/utils/catch-async";

import type { ZodError } from "zod";
import type { ValidateOptions } from "@/core/middlewares/validate/request-validate-types";

function getUnrecognizedKeysMessage(error: ZodError): string | null {
  const extraKeys = error.issues
    .filter((issue) => issue.code === "unrecognized_keys")
    .flatMap((issue) => issue.keys ?? []);

  if (extraKeys.length > 0) {
    return `فیلد(های) نامعتبر ارسال شده‌اند: ${extraKeys.join("، ")}`;
  }

  return null;
}

export const validate = <TBody, TParams, TQuery>(
  validateOptions?: ValidateOptions<TBody, TParams, TQuery>
) =>
  catchAsync(async (req, res, next) => {
    if (validateOptions?.body) {
      const result = validateOptions.body.safeParse(req.body);

      if (!result.success) {
        const extraFieldMsg = getUnrecognizedKeysMessage(result.error);
        return next(
          new AppError(
            extraFieldMsg ??
              "خطا در اعتبارسنجی داده‌های ارسال‌شده در بدنه درخواست.",
            ErrorDefinitions.Validation.Invalid[1],
            result.error.flatten().fieldErrors
          )
        );
      }

      // Assign transformed data back to req.body
      req.body = result.data;
    }

    if (validateOptions?.params) {
      const result = validateOptions.params.safeParse(req.params);

      if (!result.success) {
        const extraFieldMsg = getUnrecognizedKeysMessage(result.error);
        return next(
          new AppError(
            extraFieldMsg ?? "پارامترهای آدرس به درستی وارد نشده‌اند.",
            ErrorDefinitions.Validation.Invalid[1],
            result.error.flatten().fieldErrors
          )
        );
      }
    }

    if (validateOptions?.query) {
      const validateQuery = validateOptions.query.safeParse(req.query);

      if (!validateQuery.success) {
        return next(
          new AppError(
            validateQuery.error.message,
            ErrorDefinitions.Validation.Invalid[1]
          )
        );
      }
    }

    next();
  });
