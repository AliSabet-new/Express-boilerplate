import fs from "fs";
import path from "path";
import sharp from "sharp";
import multer from "multer";

import type { Request } from "express";
import type { StorageEngine, FileFilterCallback } from "multer";
import type { UploadedFileDetails } from "@/common/types/express";

export interface MulterConfig {
  destination?: string;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  fileNamePrefix?: string;
  preserveOriginalName?: boolean;
  strictValidation?: boolean;
  customFileNameField?: string;
}

export interface SharpConfig {
  enabled?: boolean;
  resize?: {
    width?: number;
    height?: number;
    fit?: "cover" | "contain" | "fill" | "inside" | "outside";
  };
  format?: "jpeg" | "png" | "webp" | "avif" | "original";
  quality?: number;
  withoutEnlargement?: boolean;
}

interface ProcessedFile extends Express.Multer.File {
  optimized?: boolean;
  originalSize?: number;
  optimizedSize?: number;
}

class UploadMiddleware {
  private defaultConfig: MulterConfig = {
    destination: "./storage",
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    fileNamePrefix: "",
    preserveOriginalName: false,
    strictValidation: true, // Validate both MIME and extension by default
  };

  private defaultSharpConfig: SharpConfig = {
    enabled: true,
    quality: 80,
    format: "webp",
    withoutEnlargement: true,
  };

  private readonly extensionPresets = {
    images: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"],
    documents: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"],
    videos: [".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv", ".webm"],
    audio: [".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac"],
    archives: [".zip", ".rar", ".7z", ".tar", ".gz"],
    all: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".doc", ".docx", ".mp4", ".mp3"],
  };

  constructor() {
    this.ensureStorageExists(this.defaultConfig.destination!);
  }

  private ensureStorageExists(destination: string): void {
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
      console.log(`✓ Storage directory created: ${destination}`);
    }
  }

  private convertToFileDetails(
    file: Express.Multer.File | ProcessedFile,
    baseUrl: string = "/uploads",
  ): UploadedFileDetails {
    // Normalize path to use forward slashes (already normalized after optimization)
    const normalizedPath = file.path.replace(/\\/g, "/");

    // Get extension from the actual file path
    const actualExt = path.extname(normalizedPath);

    // Get relative path for URL generation
    const destination = (this.defaultConfig.destination || "./storage").replace(/\\/g, "/");
    const relativePath = path.relative(destination, normalizedPath).replace(/\\/g, "/");

    // Generate URL (ensure no double slashes)
    const cleanRelativePath = relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;
    const url = `${baseUrl}/${cleanRelativePath}`;

    const processedFile = file as ProcessedFile;

    return {
      fieldname: file.fieldname,
      originalname: file.originalname,
      filename: path.basename(normalizedPath),
      mimetype: file.mimetype,
      size: processedFile.optimizedSize ?? file.size,
      path: normalizedPath,
      ext: actualExt,
      url: url,
      optimized: processedFile.optimized,
      originalSize: processedFile.originalSize,
      optimizedSize: processedFile.optimizedSize,
    };
  }

  getFileUrl(filePath: string, baseUrl: string = "/uploads"): string {
    const relativePath = path.relative(this.defaultConfig.destination || "./storage", filePath);
    return `${baseUrl}/${relativePath.replace(/\\/g, "/")}`;
  }

  private slugifyForFilename(name: string): string {
    return (
      name
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase() || "file"
    );
  }

  private getCustomNameFromRequest(req: Request, field: string): string {
    const raw =
      (req.body && typeof req.body[field] === "string" && req.body[field]) ||
      (req.query && typeof req.query[field] === "string" && req.query[field]);
    if (!raw || !raw.trim()) return "pic";
    return this.slugifyForFilename(raw);
  }

  private generateFileName(
    originalName: string,
    prefix: string,
    preserveOriginal: boolean,
    targetExt?: string,
    customBaseName?: string,
  ): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const originalExt = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, originalExt);
    const base = customBaseName ?? this.slugifyForFilename(nameWithoutExt);
    const ext = targetExt || originalExt;

    if (preserveOriginal) {
      return `${prefix}${base}${ext}`;
    }

    return `${prefix}${base}-${timestamp}-${random}${ext}`;
  }

  private createStorage(config: MulterConfig, sharpConfig?: SharpConfig): StorageEngine {
    // If Sharp is enabled and format is specified, use memory storage
    // so we can process the buffer before saving
    const mergedSharpConfig = sharpConfig ? { ...this.defaultSharpConfig, ...sharpConfig } : this.defaultSharpConfig;

    if (mergedSharpConfig.enabled && mergedSharpConfig.format && mergedSharpConfig.format !== "original") {
      // Use memory storage to get file buffer for processing
      return multer.memoryStorage();
    }

    // Otherwise use regular disk storage
    return multer.diskStorage({
      destination: (req, file, cb) => {
        const dest = config.destination || this.defaultConfig.destination!;
        this.ensureStorageExists(dest);
        cb(null, dest);
      },
      filename: (req, file, cb) => {
        const customName = config.customFileNameField
          ? this.getCustomNameFromRequest(req as Request, config.customFileNameField)
          : undefined;
        const fileName = this.generateFileName(
          file.originalname,
          config.fileNamePrefix || "",
          config.preserveOriginalName || false,
          undefined,
          customName,
        );
        cb(null, fileName);
      },
    });
  }

  private async processAndSaveFile(
    req: Request,
    file: Express.Multer.File,
    config: MulterConfig,
    sharpConfig: SharpConfig,
  ): Promise<{
    path: string;
    filename: string;
    size: number;
    originalSize: number;
    optimizedSize: number;
  }> {
    const dest = config.destination || this.defaultConfig.destination!;
    this.ensureStorageExists(dest);

    const mergedConfig = { ...this.defaultSharpConfig, ...sharpConfig };
    const targetExt = `.${mergedConfig.format}`;
    const customName = config.customFileNameField
      ? this.getCustomNameFromRequest(req, config.customFileNameField)
      : undefined;
    const fileName = this.generateFileName(
      file.originalname,
      config.fileNamePrefix || "",
      config.preserveOriginalName || false,
      targetExt,
      customName,
    );
    const filePath = path.join(dest, fileName).replace(/\\/g, "/");

    const originalSize = file.buffer.length;

    // Process image with Sharp
    let transformer = sharp(file.buffer);

    // Apply resize if configured
    if (mergedConfig.resize) {
      transformer = transformer.resize({
        width: mergedConfig.resize.width,
        height: mergedConfig.resize.height,
        fit: mergedConfig.resize.fit || "cover",
        withoutEnlargement: mergedConfig.withoutEnlargement,
      });
    }

    // Apply format and quality
    switch (mergedConfig.format) {
      case "jpeg":
        transformer = transformer.jpeg({ quality: mergedConfig.quality });
        break;
      case "png":
        transformer = transformer.png({ quality: mergedConfig.quality });
        break;
      case "webp":
        transformer = transformer.webp({ quality: mergedConfig.quality });
        break;
      case "avif":
        transformer = transformer.avif({ quality: mergedConfig.quality });
        break;
    }

    // Save processed image directly to disk
    await transformer.toFile(filePath);
    const optimizedSize = fs.statSync(filePath).size;

    return {
      path: filePath,
      filename: fileName,
      size: optimizedSize,
      originalSize,
      optimizedSize,
    };
  }

  private validateExtension(filename: string, allowedExtensions: string[]): boolean {
    const ext = path.extname(filename).toLowerCase();
    return allowedExtensions.some((allowed) => allowed.toLowerCase() === ext);
  }

  private createFileFilter(
    config: MulterConfig,
  ): (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => void {
    return (req, file, cb) => {
      const allowedMimeTypes = config.allowedMimeTypes || this.defaultConfig.allowedMimeTypes || [];
      const allowedExtensions = config.allowedExtensions || this.defaultConfig.allowedExtensions || [];
      const strictValidation = config.strictValidation ?? this.defaultConfig.strictValidation;

      // Get file extension
      const fileExt = path.extname(file.originalname).toLowerCase();

      // Validate MIME type
      const mimeTypeValid = allowedMimeTypes.length === 0 || allowedMimeTypes.includes(file.mimetype);

      // Validate extension
      const extensionValid =
        allowedExtensions.length === 0 || this.validateExtension(file.originalname, allowedExtensions);

      // Strict validation: Both MIME type AND extension must match
      if (strictValidation) {
        if (!mimeTypeValid || !extensionValid) {
          const errors: string[] = [];

          if (!mimeTypeValid) {
            errors.push(`نوع فایل نامعتبر است. انواع مجاز: ${allowedMimeTypes.join(", ")}`);
          }

          if (!extensionValid) {
            errors.push(`پسوند فایل نامعتبر است. پسوندهای مجاز: ${allowedExtensions.join(", ")}`);
          }

          return cb(new Error(errors.join(" | ")) as any);
        }

        cb(null, true);
      } else {
        // Loose validation: Either MIME type OR extension must match
        if (mimeTypeValid || extensionValid) {
          cb(null, true);
        } else {
          cb(
            new Error(
              `فایل نامعتبر است. انواع مجاز: ${allowedMimeTypes.join(
                ", ",
              )} یا پسوندهای مجاز: ${allowedExtensions.join(", ")}`,
            ) as any,
          );
        }
      }
    };
  }

  getExtensionPreset(preset: "images" | "documents" | "videos" | "audio" | "archives" | "all"): string[] {
    return [...this.extensionPresets[preset]];
  }

  private async optimizeImage(
    filePath: string,
    sharpConfig: SharpConfig,
  ): Promise<{
    originalSize: number;
    optimizedSize: number;
    optimizedPath: string;
  }> {
    const originalSize = fs.statSync(filePath).size;
    const normalizedPath = filePath.replace(/\\/g, "/");

    // Merge with defaults first, then check if enabled
    const config = { ...this.defaultSharpConfig, ...sharpConfig };

    if (!config.enabled) {
      return {
        originalSize,
        optimizedSize: originalSize,
        optimizedPath: normalizedPath,
      };
    }
    let transformer = sharp(filePath);

    // Apply resize if configured
    if (config.resize) {
      transformer = transformer.resize({
        width: config.resize.width,
        height: config.resize.height,
        fit: config.resize.fit || "cover",
        withoutEnlargement: config.withoutEnlargement,
      });
    }

    // Apply format and quality
    switch (config.format) {
      case "jpeg":
        transformer = transformer.jpeg({ quality: config.quality });
        break;
      case "png":
        transformer = transformer.png({ quality: config.quality });
        break;
      case "webp":
        transformer = transformer.webp({ quality: config.quality });
        break;
      case "avif":
        transformer = transformer.avif({ quality: config.quality });
        break;
    }

    // Normalize file path first for consistent extension replacement
    const normalizedFilePath = filePath.replace(/\\/g, "/");

    // Get extension and create optimized path
    const ext = path.extname(normalizedFilePath).toLowerCase();
    const newExt = `.${config.format}`;

    // Create optimized path with new extension
    let optimizedPath: string;
    if (ext !== newExt) {
      // Replace extension: remove old extension and add new one
      optimizedPath = normalizedFilePath.slice(0, -ext.length) + newExt;
    } else {
      optimizedPath = normalizedFilePath;
    }

    // Save optimized image to the new path
    await transformer.toFile(optimizedPath);

    // Get optimized file size
    const optimizedSize = fs.statSync(optimizedPath).size;

    // Remove original file if format changed (completely non-blocking, runs in background)
    if (ext !== newExt && normalizedFilePath !== optimizedPath) {
      // Schedule deletion in next event loop tick to ensure file handle is released
      // Use setTimeout with 0 delay to ensure it runs after current execution
      setTimeout(async () => {
        try {
          const deleteOriginal = async (retries = 5): Promise<void> => {
            for (let i = 0; i < retries; i++) {
              try {
                if (fs.existsSync(normalizedFilePath)) {
                  // Increasing delay to ensure file handle is released (Windows needs more time)
                  await new Promise((resolve) => setTimeout(resolve, 500 + i * 300));
                  fs.unlinkSync(normalizedFilePath);
                  console.log(`✓ Deleted original file: ${normalizedFilePath}`);
                  return;
                }
              } catch (error: any) {
                if (i === retries - 1) {
                  // Log warning but don't fail - file will be cleaned up later
                  console.warn(
                    `⚠ Could not delete original file ${normalizedFilePath}: ${error.message}. It will be cleaned up later.`,
                  );
                }
              }
            }
          };

          await deleteOriginal();
        } catch (error) {
          // Silently catch any errors - deletion failures shouldn't break the flow
          console.warn(`⚠ Background file deletion failed: ${error}`);
        }
      }, 0);
    }

    return { originalSize, optimizedSize, optimizedPath };
  }

  single(fieldName: string, multerConfig: MulterConfig = {}, sharpConfig: SharpConfig = {}) {
    const config = { ...this.defaultConfig, ...multerConfig };
    const mergedSharpConfig = { ...this.defaultSharpConfig, ...sharpConfig };
    const storage = this.createStorage(config, sharpConfig);

    const upload = multer({
      storage,
      limits: { fileSize: config.maxFileSize },
      fileFilter: this.createFileFilter(config),
    }).single(fieldName);

    return async (req: Request, res: any, next: any) => {
      upload(req, res, async (err: any) => {
        if (err) {
          return next(err);
        }

        if (req.file) {
          const file = req.file as unknown as ProcessedFile;

          // Process image before saving if Sharp is enabled
          if (
            file.mimetype.startsWith("image/") &&
            mergedSharpConfig.enabled &&
            mergedSharpConfig.format &&
            mergedSharpConfig.format !== "original" &&
            file.buffer // Ensure buffer exists (memory storage)
          ) {
            try {
              // Process file buffer and save directly (no original file saved)
              const processed = await this.processAndSaveFile(req, file, config, mergedSharpConfig);

              // Update file object with processed file info
              file.path = processed.path;
              file.filename = processed.filename;
              file.size = processed.size;
              file.optimized = true;
              file.originalSize = processed.originalSize;
              file.optimizedSize = processed.optimizedSize;

              console.log(
                `✓ Image processed: ${processed.originalSize} → ${processed.optimizedSize} bytes (${Math.round(
                  (1 - processed.optimizedSize / processed.originalSize) * 100,
                )}% reduction)`,
              );
            } catch (error) {
              console.error("✗ Image processing failed:", error);
              return next(error);
            }
          }

          // Convert to structured file details and attach to request
          req.file = this.convertToFileDetails(file) as any;
        }

        next();
      });
    };
  }

  multiple(fieldName: string, maxCount: number = 10, multerConfig: MulterConfig = {}, sharpConfig: SharpConfig = {}) {
    const config = { ...this.defaultConfig, ...multerConfig };
    const mergedSharpConfig = { ...this.defaultSharpConfig, ...sharpConfig };
    const storage = this.createStorage(config, sharpConfig);

    const upload = multer({
      storage,
      limits: { fileSize: config.maxFileSize },
      fileFilter: this.createFileFilter(config),
    }).array(fieldName, maxCount);

    return async (req: Request, res: any, next: any) => {
      upload(req, res, async (err: any) => {
        if (err) {
          return next(err);
        }

        if (req.files && Array.isArray(req.files)) {
          const files = req.files as unknown as ProcessedFile[];

          // Process all images before saving
          for (const file of files) {
            if (
              file.mimetype.startsWith("image/") &&
              mergedSharpConfig.enabled &&
              mergedSharpConfig.format &&
              mergedSharpConfig.format !== "original" &&
              file.buffer // Ensure buffer exists (memory storage)
            ) {
              try {
                // Process file buffer and save directly (no original file saved)
                const processed = await this.processAndSaveFile(req, file, config, mergedSharpConfig);

                // Update file object with processed file info
                file.path = processed.path;
                file.filename = processed.filename;
                file.size = processed.size;
                file.optimized = true;
                file.originalSize = processed.originalSize;
                file.optimizedSize = processed.optimizedSize;

                console.log(
                  `✓ Image processed: ${file.originalname} (${Math.round(
                    (1 - processed.optimizedSize / processed.originalSize) * 100,
                  )}% reduction)`,
                );
              } catch (error) {
                console.error(`✗ Image processing failed for ${file.originalname}:`, error);
              }
            }
          }

          // Convert to structured file details array
          req.files = files.map((file) => this.convertToFileDetails(file)) as any;
        }

        next();
      });
    };
  }

  fields(fields: { name: string; maxCount: number }[], multerConfig: MulterConfig = {}, sharpConfig: SharpConfig = {}) {
    const config = { ...this.defaultConfig, ...multerConfig };
    const mergedSharpConfig = { ...this.defaultSharpConfig, ...sharpConfig };
    const storage = this.createStorage(config, sharpConfig);

    const upload = multer({
      storage,
      limits: { fileSize: config.maxFileSize },
      fileFilter: this.createFileFilter(config),
    }).fields(fields);

    return async (req: Request, res: any, next: any) => {
      upload(req, res, async (err: any) => {
        if (err) {
          return next(err);
        }

        if (req.files && typeof req.files === "object") {
          const filesObj = req.files as unknown as {
            [fieldname: string]: ProcessedFile[];
          };

          const structuredFiles: {
            [fieldname: string]: UploadedFileDetails[];
          } = {};

          // Process all images in all fields before saving
          for (const fieldName in filesObj) {
            const files = filesObj[fieldName];
            const processedFiles: UploadedFileDetails[] = [];

            for (const file of files) {
              if (
                file.mimetype.startsWith("image/") &&
                mergedSharpConfig.enabled &&
                mergedSharpConfig.format &&
                mergedSharpConfig.format !== "original" &&
                file.buffer // Ensure buffer exists (memory storage)
              ) {
                try {
                  // Process file buffer and save directly (no original file saved)
                  const processed = await this.processAndSaveFile(req, file, config, mergedSharpConfig);

                  // Update file object with processed file info
                  file.path = processed.path;
                  file.filename = processed.filename;
                  file.size = processed.size;
                  file.optimized = true;
                  file.originalSize = processed.originalSize;
                  file.optimizedSize = processed.optimizedSize;

                  console.log(
                    `✓ Image processed: ${file.originalname} (${Math.round(
                      (1 - processed.optimizedSize / processed.originalSize) * 100,
                    )}% reduction)`,
                  );
                } catch (error) {
                  console.error(`✗ Image processing failed for ${file.originalname}:`, error);
                }
              }

              // Convert to structured file details
              processedFiles.push(this.convertToFileDetails(file));
            }

            structuredFiles[fieldName] = processedFiles;
          }

          // Attach structured files to request
          req.files = structuredFiles as any;
        }

        next();
      });
    };
  }

  deleteFile(filePath: string): void {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✓ File deleted: ${filePath}`);
    }
  }

  deleteFiles(filePaths: string[]): void {
    filePaths.forEach((filePath) => this.deleteFile(filePath));
  }
}

export default new UploadMiddleware();
