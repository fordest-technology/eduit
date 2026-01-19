import { v2 as cloudinary } from "cloudinary";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { checkCloudinaryConfig } from "./env-check";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(file: string): Promise<string> {
  try {
    // Check if Cloudinary is configured
    if (checkCloudinaryConfig()) {
      // Upload the image to Cloudinary
      const result = await cloudinary.uploader.upload(file, {
        folder: "eduit",
      });

      // Return the secure URL
      return result.secure_url;
    } else {
      // Fallback to local storage if Cloudinary is not configured
      console.log("Cloudinary not configured, falling back to local storage");
      
      // Extract base64 data
      const base64Data = file.split(",")[1];
      if (!base64Data) {
        throw new Error("Invalid base64 data");
      }
      
      const buffer = Buffer.from(base64Data, "base64");
      
      // Create relative path and filename
      const filename = `${randomUUID()}.png`;
      const uploadDir = join(process.cwd(), "public", "uploads");
      
      // Ensure directory exists
      await mkdir(uploadDir, { recursive: true });
      
      // Write file
      const filePath = join(uploadDir, filename);
      await writeFile(filePath, buffer);
      
      // Return public path
      return `/uploads/${filename}`;
    }
  } catch (error) {
    console.error("Error in uploadImage:", error);
    throw new Error("Failed to upload image");
  }
}

export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    throw new Error("Failed to delete image");
  }
}

// Extract public ID from Cloudinary URL
export function getPublicIdFromUrl(url: string): string {
  const parts = url.split("/");
  const filename = parts[parts.length - 1];
  const publicId = filename.split(".")[0];
  return `eduit/${publicId}`;
}
