import { NextResponse } from "next/server";
import {
  sendTeacherCredentialsEmail,
  sendStudentCredentialsEmail,
  sendWelcomeEmail,
} from "@/lib/email";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { generateEmailDebugId } from "@/lib/utils";

// Define interface for API call tracking
interface ApiCallRecord {
  requestId: string;
  timestamp: string;
  email: string;
  role: string;
  success: boolean;
  error: string | undefined;
  duration: number;
  steps: { time: number; msg: string; details?: any; error?: string }[];
}

// Track API calls in memory for debugging (development only)
const apiCalls: ApiCallRecord[] = [];

// Endpoint to send credentials via email
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, role, schoolName, password, schoolId, schoolUrl } =
      body;

    // Input validation
    if (!name || !email || !role || !schoolName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use the provided password or generate a fallback one
    const userPassword = password || "TestPassword123";

    // Generate a debug ID to track this email
    const debugId = generateEmailDebugId();

    // Send welcome email with credentials
    const result = await sendWelcomeEmail({
      name,
      email,
      role,
      schoolName,
      schoolUrl: schoolUrl || "https://eduit.app",
      password: userPassword,
      schoolId,
      debugId,
    });

    return NextResponse.json({
      success: true,
      message: "Credentials sent successfully",
      debugId,
      result,
    });
  } catch (error: any) {
    console.error("Error sending credentials:", error);
    return NextResponse.json(
      { error: "Failed to send credentials", message: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve email configuration and debug info
export async function GET() {
  try {
    // Get the list of email debug files if in development
    const fs = require("fs");
    const path = require("path");
    const emailDebugDir = path.join(process.cwd(), ".email-debug");

    const apiCalls: Array<any> = [];

    // Create directory if it doesn't exist
    if (!fs.existsSync(emailDebugDir)) {
      fs.mkdirSync(emailDebugDir, { recursive: true });
    }

    // Get email configuration
    const emailConfig = {
      emailHost: process.env.EMAIL_HOST || "not configured",
      emailPort: process.env.EMAIL_PORT || "not configured",
      emailUser: process.env.EMAIL_USER ? "configured" : "not configured",
      emailFrom: process.env.EMAIL_FROM || "not configured",
    };

    return NextResponse.json({
      apiCalls,
      emailDebugDir: ".email-debug",
      emailConfig,
    });
  } catch (error: any) {
    console.error("Error fetching email debug info:", error);
    return NextResponse.json(
      { error: "Failed to fetch email debug info", message: error.message },
      { status: 500 }
    );
  }
}
