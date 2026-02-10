import { randomBytes } from "crypto";
import type { Request } from "express";
import type {
  UploadedFileDetails,
  TypedFiles,
  TypedFile,
  TypedFilesArray,
} from "@/common/types/express";

class CommonUtils {
  generateRandomCode = (
    length: number = 6,
    type: "number" | "string" = "number"
  ) => {
    if (type === "number") {
      const code = Math.floor(
        10 ** (length - 1) + Math.random() * 9 * 10 ** (length - 1)
      ).toString();
      return code;
    } else {
      const bytes = randomBytes(length);
      let code = "";
      for (let i = 0; i < length; i++) {
        const randomValue = bytes[i] % 36;
        if (randomValue < 10) {
          code += randomValue.toString();
        } else {
          code += String.fromCharCode(87 + randomValue);
        }
      }
      return code;
    }
  };

  getFirstFile<T extends string>(
    req: Request,
    fieldName: T
  ): UploadedFileDetails | undefined {
    return this.getFilesByField(req, fieldName)[0];
  }

  getFilesByField<T extends string>(
    req: Request,
    fieldName: T
  ): UploadedFileDetails[] {
    if (!req.files || typeof req.files !== "object" || Array.isArray(req.files)) {
      return [];
    }

    const files = req.files as unknown as {
      [key: string]: UploadedFileDetails[];
    };
    return files[fieldName] || [];
  }

  getFileByField<T extends string>(
    req: Request,
    fieldName: T
  ): UploadedFileDetails | undefined {
    return this.getFilesByField(req, fieldName)[0];
  }

  getTypedFiles<T extends string>(
    req: Request,
    fieldNames: readonly T[]
  ): TypedFiles<T> {
    if (!req.files || typeof req.files !== "object" || Array.isArray(req.files)) {
      throw new Error(
        `Expected files object with fields: ${fieldNames.join(", ")}`
      );
    }

    const files = req.files as unknown as {
      [key: string]: UploadedFileDetails[];
    };

    for (const fieldName of fieldNames) {
      if (!files[fieldName] || !Array.isArray(files[fieldName])) {
        throw new Error(`Missing required file field: ${fieldName}`);
      }
    }

    return files as TypedFiles<T>;
  }

  getTypedFilesOptional<T extends string>(
    req: Request,
    fieldNames: readonly T[]
  ): TypedFiles<T> {
    if (!req.files || typeof req.files !== "object" || Array.isArray(req.files)) {
      const emptyFiles = {} as TypedFiles<T>;
      for (const fieldName of fieldNames) {
        emptyFiles[fieldName] = [];
      }
      return emptyFiles;
    }

    const files = req.files as unknown as {
      [key: string]: UploadedFileDetails[];
    };

    const result = {} as TypedFiles<T>;
    for (const fieldName of fieldNames) {
      result[fieldName] = files[fieldName] || [];
    }

    return result;
  }

  getTypedFile(req: Request): TypedFile {
    if (!req.file) {
      throw new Error("Expected single file but none found");
    }
    return req.file as unknown as UploadedFileDetails;
  }

  getTypedFilesArray(req: Request): TypedFilesArray {
    if (!req.files || !Array.isArray(req.files)) {
      throw new Error("Expected files array but found object or undefined");
    }
    return req.files as unknown as UploadedFileDetails[];
  }
}

export const commonUtilsInstance = new CommonUtils();
export { CommonUtils };
