import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { promises as fsPromises } from "fs";

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  // Only allow in development mode for security
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Debug routes are only available in development mode" },
      { status: 403 }
    );
  }

  const { filename } = params;

  // Security check - ensure filename doesn't contain path traversal
  if (!filename || filename.includes("..") || !filename.endsWith(".html")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  try {
    const emailDebugDir = path.join(process.cwd(), ".email-debug");
    const filePath = path.join(emailDebugDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Email file not found" },
        { status: 404 }
      );
    }

    // Read file content
    const fileContent = await fsPromises.readFile(filePath, "utf-8");

    // Return the HTML content with proper content type
    return new Response(fileContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error serving email debug file:", error);
    return NextResponse.json(
      { error: "Failed to read email file" },
      { status: 500 }
    );
  }
}
