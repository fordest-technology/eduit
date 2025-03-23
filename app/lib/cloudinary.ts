import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file to Cloudinary and returns the URL
 * @param buffer - The file buffer to upload
 * @param folder - Optional folder name to organize uploads
 * @returns The URL of the uploaded file
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder = "eduit"
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: "auto",
    };

    // Convert buffer to base64 string for Cloudinary upload
    const base64String = buffer.toString("base64");
    const dataUri = `data:image/jpeg;base64,${base64String}`;

    cloudinary.uploader.upload(dataUri, uploadOptions, (error, result) => {
      if (error) {
        console.error("Cloudinary upload error:", error);
        reject(error);
        return;
      }

      resolve(result?.secure_url || "");
    });
  });
}
