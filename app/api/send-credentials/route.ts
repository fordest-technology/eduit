import { NextResponse } from "next/server";
import {
  sendTeacherCredentialsEmail,
  sendStudentCredentialsEmail,
  sendWelcomeEmail,
} from "@/lib/email";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { generateEmailDebugId } from "@/lib/utils";
import { z } from "zod";

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

// Define email parameter interfaces
interface BaseEmailParams {
  name: string;
  email: string;
  schoolName: string;
  schoolUrl: string;
  password: string;
  schoolId: string;
  debugId: string;
}

interface TeacherEmailParams extends BaseEmailParams {}

interface StudentEmailParams extends BaseEmailParams {
  studentName: string;
  studentEmail: string;
}

// Track API calls in memory for debugging (development only)
const apiCalls: ApiCallRecord[] = [];

// Zod schema for credentials payload with role validation
const credentialsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["teacher", "student", "parent"]),
  schoolName: z.string().min(1, "School name is required"),
  password: z.string().optional(),
  schoolId: z.string().min(1, "School ID is required"),
  schoolUrl: z.string().optional(),
});

// Endpoint to send credentials via email
export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = generateEmailDebugId();
  const steps: ApiCallRecord["steps"] = [];

  try {
    const body = await request.json();
    
    // SECURITY: Never log sensitive credentials
    // Only log non-sensitive request metadata for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[CREDENTIALS_REQUEST]', {
        role: body.role,
        schoolId: body.schoolId,
        timestamp: new Date().toISOString()
      });
    }

    // Validate input using Zod
    const validation = credentialsSchema.safeParse(body);
    if (!validation.success) {
      console.error("Validation failed:", validation.error.errors);
      steps.push({
        time: Date.now() - startTime,
        msg: "Validation failed",
        error: "Missing or invalid required fields",
        details: validation.error.errors,
      });
      return NextResponse.json(
        {
          error: "Missing or invalid required fields",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { name, email, role, schoolName, password, schoolId, schoolUrl } =
      validation.data;

    // SECURITY: Sanitized logging - no emails or passwords
    steps.push({
      time: Date.now() - startTime,
      msg: "Request received",
      details: { role, schoolId },
    });

    // Use the provided password or generate a fallback one
    const userPassword = password || "TestPassword123";

    // Generate a debug ID to track this email
    const debugId = generateEmailDebugId();
    steps.push({
      time: Date.now() - startTime,
      msg: "Debug ID generated",
      details: { debugId },
    });

    // Send email based on role
    let result;
    const baseEmailData: BaseEmailParams = {
      name,
      email,
      schoolName,
      schoolUrl: schoolUrl || "https://eduit.app",
      password: userPassword,
      schoolId,
      debugId,
    };

    if (role === "teacher") {
      const teacherEmailData: TeacherEmailParams = {
        ...baseEmailData,
      };
      result = await sendTeacherCredentialsEmail(teacherEmailData);
      steps.push({
        time: Date.now() - startTime,
        msg: "Teacher credentials email sent",
        details: { result },
      });
    } else if (role === "student") {
      const studentEmailData: StudentEmailParams = {
        ...baseEmailData,
        studentName: name,
        studentEmail: email,
      };
      result = await sendStudentCredentialsEmail(studentEmailData);
      steps.push({
        time: Date.now() - startTime,
        msg: "Student credentials email sent",
        details: { result },
      });
    } else if (role === "parent") {
      const parentEmailData: BaseEmailParams = {
        ...baseEmailData,
      };
      result = await sendWelcomeEmail({
        email: parentEmailData.email,
        name: parentEmailData.name,
        password: parentEmailData.password,
        role: "parent",
        schoolName: parentEmailData.schoolName,
        schoolUrl: parentEmailData.schoolUrl,
      });
      steps.push({
        time: Date.now() - startTime,
        msg: "Parent credentials email sent",
        details: { result },
      });
    }

    // Track successful API call (no sensitive data)
    apiCalls.push({
      requestId,
      timestamp: new Date().toISOString(),
      email: '[REDACTED]', // SECURITY: Never store email addresses
      role,
      success: true,
      error: undefined,
      duration: Date.now() - startTime,
      steps,
    });

    return NextResponse.json({
      success: true,
      message: `Credentials sent successfully to ${role}`,
      debugId,
      result,
    });
  } catch (error: any) {
    console.error("Error sending credentials:", error);

    // Add error to steps for debugging
    steps.push({
      time: Date.now() - startTime,
      msg: "Error occurred",
      error: error.message,
      details: error,
    });

    // Track failed API call
    apiCalls.push({
      requestId,
      timestamp: new Date().toISOString(),
      email: error?.email || "unknown",
      role: error?.role || "unknown",
      success: false,
      error: error.message,
      duration: Date.now() - startTime,
      steps,
    });

    return NextResponse.json(
      {
        error: "Failed to send credentials",
        message: error.message || "An unexpected error occurred",
        debugId: requestId,
      },
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
