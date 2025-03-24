import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import fs from "fs";
import path from "path";

// This endpoint is only available in development mode
export async function GET(request: NextRequest) {
  // Don't allow in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is not available in production" },
      { status: 403 }
    );
  }

  const session = await getSession();

  // Only allow super_admin or school_admin in development
  if (!session || !["super_admin", "school_admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const debugDir = path.join(process.cwd(), ".debug-emails");

    // Create directory if it doesn't exist
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
      return NextResponse.json({ emails: [] }, { status: 200 });
    }

    // Get all email files
    const files = fs
      .readdirSync(debugDir)
      .filter((file) => file.startsWith("email-") && file.endsWith(".html"))
      .sort((a, b) => {
        // Sort by file creation time (most recent first)
        return (
          fs.statSync(path.join(debugDir, b)).mtimeMs -
          fs.statSync(path.join(debugDir, a)).mtimeMs
        );
      })
      .slice(0, 20); // Only return the 20 most recent emails

    // Build response
    const emails = files.map((file) => {
      const filePath = path.join(debugDir, file);
      const stats = fs.statSync(filePath);

      return {
        id: file.replace(/^email-/, "").replace(/\.html$/, ""),
        filename: file,
        createdAt: stats.mtime.toISOString(),
        size: stats.size,
      };
    });

    return NextResponse.json({ emails }, { status: 200 });
  } catch (error) {
    console.error("Error retrieving debug emails:", error);
    return NextResponse.json(
      { error: "Failed to retrieve debug emails" },
      { status: 500 }
    );
  }
}

// Get a specific debug email by ID
export async function POST(request: NextRequest) {
  // Don't allow in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is not available in production" },
      { status: 403 }
    );
  }

  const session = await getSession();

  // Only allow super_admin or school_admin in development
  if (!session || !["super_admin", "school_admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { filename } = await request.json();

    if (
      !filename ||
      typeof filename !== "string" ||
      !filename.startsWith("email-") ||
      !filename.endsWith(".html")
    ) {
      return NextResponse.json(
        { error: "Invalid email filename" },
        { status: 400 }
      );
    }

    const debugDir = path.join(process.cwd(), ".debug-emails");
    const filePath = path.join(debugDir, filename);

    // Safety check - make sure the file is within the debug directory
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(debugDir)) {
      return NextResponse.json(
        { error: "Invalid email filename" },
        { status: 400 }
      );
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, "utf-8");

    return NextResponse.json({ content }, { status: 200 });
  } catch (error) {
    console.error("Error retrieving debug email content:", error);
    return NextResponse.json(
      { error: "Failed to retrieve email content" },
      { status: 500 }
    );
  }
}
