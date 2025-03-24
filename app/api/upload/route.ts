import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/cloudinary";
import { getSession } from "@/lib/auth";
import { checkCloudinaryConfig } from "@/lib/env-check";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

// Helper function to handle file uploads locally if Cloudinary is not available
async function handleFileUpload(file: File): Promise<string | null> {
  try {
    // Check if Cloudinary is configured
    const isCloudinaryConfigured = checkCloudinaryConfig();

    if (isCloudinaryConfigured) {
      // Use Cloudinary for file upload
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      const dataURI = `data:${file.type};base64,${base64}`;

      return await uploadImage(dataURI);
    } else {
      // Fallback to local file storage
      const uploadDir = join(process.cwd(), "public", "uploads", "images");
      await mkdir(uploadDir, { recursive: true });

      const filename = `${randomUUID()}-${file.name.replace(/\s/g, "_")}`;
      const filePath = join(uploadDir, filename);

      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);

      return `/uploads/images/${filename}`;
    }
  } catch (error) {
    console.error("Error handling file upload:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    ``;
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if the request is multipart/form-data
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new NextResponse("Invalid content type", { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file || file.size === 0) {
      return new NextResponse("No file provided", { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return new NextResponse("Invalid file type", { status: 400 });
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return new NextResponse("File too large (max 5MB)", { status: 400 });
    }

    const imageUrl = await handleFileUpload(file);

    if (!imageUrl) {
      return new NextResponse("Failed to upload file", { status: 500 });
    }

    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error("[UPLOAD_POST]", error);
    return new NextResponse("Internal error", {
      status: 500,
      statusText: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
