import sharp from "sharp";
import path from "path";
import fs from "fs";
import FileType from "file-type";

/**
 * Validate file MIME type using magic numbers
 */
export async function validateFileType(buffer: Buffer): Promise<{ valid: boolean; mimeType?: string; error?: string }> {
  try {
    const fileType = await FileType.fromBuffer(buffer);
    
    if (!fileType) {
      return { valid: false, error: "Unable to detect file type" };
    }
    
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/quicktime"
    ];
    
    if (!allowedMimeTypes.includes(fileType.mime)) {
      return { valid: false, error: `File type ${fileType.mime} is not allowed` };
    }
    
    return { valid: true, mimeType: fileType.mime };
  } catch (error) {
    return { valid: false, error: "Failed to validate file type" };
  }
}

/**
 * Optimize image using Sharp
 * - Resize to max 1920x1920
 * - Generate thumbnail 200x200
 * - Convert to WebP for better compression
 * - Remove EXIF data for privacy
 */
export async function optimizeImage(
  inputPath: string,
  outputPath: string,
  generateThumbnail: boolean = true
): Promise<{ optimized: string; thumbnail?: string }> {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // Main optimized image (max 1920x1920)
    await image
      .resize(1920, 1920, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .rotate() // Auto-rotate based on EXIF
      .toFile(outputPath);
    
    let thumbnailPath: string | undefined;
    
    // Generate thumbnail if requested
    if (generateThumbnail) {
      const thumbnailDir = path.join(path.dirname(outputPath), "thumbnails");
      if (!fs.existsSync(thumbnailDir)) {
        fs.mkdirSync(thumbnailDir, { recursive: true });
      }
      
      thumbnailPath = path.join(thumbnailDir, path.basename(outputPath));
      
      await sharp(inputPath)
        .resize(200, 200, {
          fit: "cover",
          position: "center",
        })
        .webp({ quality: 80 })
        .toFile(thumbnailPath);
    }
    
    // Delete original if optimization succeeded
    if (fs.existsSync(inputPath) && inputPath !== outputPath) {
      fs.unlinkSync(inputPath);
    }
    
    return {
      optimized: outputPath,
      thumbnail: thumbnailPath,
    };
  } catch (error) {
    console.error("Image optimization failed:", error);
    throw new Error("Failed to optimize image");
  }
}

/**
 * Check if file is an image (not video)
 */
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

/**
 * Get file size in MB
 */
export function getFileSizeMB(filePath: string): number {
  const stats = fs.statSync(filePath);
  return stats.size / (1024 * 1024);
}
