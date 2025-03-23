// This route is for development only and helps debug email sending issues
// It displays a list of debug email files and allows viewing their contents

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { promises as fsPromises } from "fs";

// Ensure this route only works in development mode
export async function GET() {
  // Only allow in development mode for security
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Debug routes are only available in development mode" },
      { status: 403 }
    );
  }

  try {
    const emailDebugDir = path.join(process.cwd(), ".email-debug");

    // Create directory if it doesn't exist
    if (!fs.existsSync(emailDebugDir)) {
      await fsPromises.mkdir(emailDebugDir, { recursive: true });
      return NextResponse.json({
        files: [],
        emailConfig: getEmailConfig(),
      });
    }

    // Read directory contents
    const files = await fsPromises.readdir(emailDebugDir);

    // Filter for HTML files and get their stats
    const emailFiles = await Promise.all(
      files
        .filter((file) => file.endsWith(".html"))
        .map(async (fileName) => {
          const filePath = path.join(emailDebugDir, fileName);
          const stats = await fsPromises.stat(filePath);

          // Parse email ID from filename format (email-E-XXXX-XXXX-timestamp.html)
          const match = fileName.match(
            /email-([^-]+(?:-[^-]+){2})-(\d+)\.html/
          );
          const emailId = match ? match[1] : "unknown";
          const timestamp = match ? parseInt(match[2]) : 0;

          return {
            name: fileName,
            emailId,
            timestamp,
            created: stats.mtime.toISOString(),
            url: `/api/debug/emails/${fileName}`,
          };
        })
    );

    // Sort by timestamp descending (newest first)
    emailFiles.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({
      files: emailFiles,
      emailConfig: getEmailConfig(),
    });
  } catch (error) {
    console.error("Error in email debug API:", error);
    return NextResponse.json(
      { error: "Failed to read email debug files" },
      { status: 500 }
    );
  }
}

// Get email configuration status
function getEmailConfig() {
  const emailConfig: Record<string, string> = {};

  // Check SMTP configuration
  emailConfig["SMTP Host"] = process.env.SMTP_HOST
    ? "configured"
    : "not-configured";
  emailConfig["SMTP Port"] = process.env.SMTP_PORT
    ? "configured"
    : "not-configured";
  emailConfig["SMTP User"] = process.env.SMTP_USER
    ? "configured"
    : "not-configured";
  emailConfig["SMTP Password"] = process.env.SMTP_PASS
    ? "configured"
    : "not-configured";
  emailConfig["Email From"] = process.env.EMAIL_FROM
    ? "configured"
    : "not-configured";

  // Check alternative providers
  emailConfig["SendGrid API Key"] = process.env.SENDGRID_API_KEY
    ? "configured"
    : "not-configured";
  emailConfig["Debug Mode"] =
    process.env.NODE_ENV === "development" ? "enabled" : "disabled";

  return emailConfig;
}
