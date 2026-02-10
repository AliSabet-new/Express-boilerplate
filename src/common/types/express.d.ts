import type { Role, Token, User } from "@prisma/client";

export interface UploadedFileDetails {
  fieldname: string;
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
  path: string;
  ext: string;
  url: string;
  optimized?: boolean;
  originalSize?: number;
  optimizedSize?: number;
}

export type TypedFiles<T extends string> = {
  [K in T]: UploadedFileDetails[];
};

export type TypedFile = UploadedFileDetails;

export type TypedFilesArray = UploadedFileDetails[];

declare global {
  namespace Express {
    interface Request {
      userId?: User["id"];
      role?: Role;
      tokenId?: Token["id"];
      file?: UploadedFileDetails;
      files?:
        | {
            [fieldname: string]: UploadedFileDetails[];
          }
        | UploadedFileDetails[];
    }
  }
}

export {};
