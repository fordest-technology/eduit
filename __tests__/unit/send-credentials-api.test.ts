import { POST } from "@/app/api/send-credentials/route";
import { NextRequest } from "next/server";
import { sendTeacherCredentialsEmail, sendStudentCredentialsEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

// Mock external dependencies
jest.mock("@/lib/email", () => ({
  sendTeacherCredentialsEmail: jest.fn(),
  sendStudentCredentialsEmail: jest.fn(),
}));
jest.mock("@/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("POST /api/send-credentials", () => {
  beforeEach(() => {
    // Reset mocks before each test
    (sendTeacherCredentialsEmail as jest.Mock).mockClear();
    (sendStudentCredentialsEmail as jest.Mock).mockClear();
    (logger.info as jest.Mock).mockClear();
    (logger.error as jest.Mock).mockClear();
  });

  it("should return 400 if name is missing", async () => {
    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        role: "teacher",
        schoolName: "Test School",
        password: "password123",
        schoolId: "school123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing or invalid required fields");
    expect(data.details[0].path[0]).toBe("name");
    expect(sendTeacherCredentialsEmail).not.toHaveBeenCalled();
  });

  it("should return 400 if email is missing", async () => {
    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        role: "teacher",
        schoolName: "Test School",
        password: "password123",
        schoolId: "school123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing or invalid required fields");
    expect(data.details[0].path[0]).toBe("email");
    expect(sendTeacherCredentialsEmail).not.toHaveBeenCalled();
  });

  it("should return 400 if email is invalid", async () => {
    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "invalid-email",
        role: "teacher",
        schoolName: "Test School",
        password: "password123",
        schoolId: "school123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing or invalid required fields");
    expect(data.details[0].path[0]).toBe("email");
    expect(sendTeacherCredentialsEmail).not.toHaveBeenCalled();
  });

  it("should return 400 if role is missing", async () => {
    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        schoolName: "Test School",
        password: "password123",
        schoolId: "school123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing or invalid required fields");
    expect(data.details[0].path[0]).toBe("role");
    expect(sendTeacherCredentialsEmail).not.toHaveBeenCalled();
  });

  it("should return 400 if schoolName is missing", async () => {
    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        role: "teacher",
        password: "password123",
        schoolId: "school123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing or invalid required fields");
    expect(data.details[0].path[0]).toBe("schoolName");
    expect(sendTeacherCredentialsEmail).not.toHaveBeenCalled();
  });

  it("should return 400 if schoolId is missing", async () => {
    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        role: "teacher",
        schoolName: "Test School",
        password: "password123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing or invalid required fields");
    expect(data.details[0].path[0]).toBe("schoolId");
    expect(sendTeacherCredentialsEmail).not.toHaveBeenCalled();
  });

  it("should send teacher credentials email successfully", async () => {
    (sendTeacherCredentialsEmail as jest.Mock).mockResolvedValueOnce({ success: true });

    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Teacher",
        email: "teacher@example.com",
        role: "teacher",
        schoolName: "Test School",
        password: "securepassword",
        schoolId: "school123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Credentials sent successfully to teacher");
    expect(sendTeacherCredentialsEmail).toHaveBeenCalledTimes(1);
    expect(sendTeacherCredentialsEmail).toHaveBeenCalledWith({
      name: "Test Teacher",
      email: "teacher@example.com",
      schoolName: "Test School",
      schoolUrl: "https://eduit.app", // Default URL if not provided
      password: "securepassword",
      schoolId: "school123",
      debugId: expect.any(String),
    });
  });

  it("should send student credentials email successfully", async () => {
    (sendStudentCredentialsEmail as jest.Mock).mockResolvedValueOnce({ success: true });

    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Student",
        email: "student@example.com",
        role: "student",
        schoolName: "Test School",
        password: "securepassword",
        schoolId: "school123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Credentials sent successfully to student");
    expect(sendStudentCredentialsEmail).toHaveBeenCalledTimes(1);
    expect(sendStudentCredentialsEmail).toHaveBeenCalledWith({
      name: "Test Student",
      email: "student@example.com",
      schoolName: "Test School",
      schoolUrl: "https://eduit.app",
      password: "securepassword",
      schoolId: "school123",
      debugId: expect.any(String),
      studentName: "Test Student",
      studentEmail: "student@example.com",
    });
  });

  it("should return 500 if email sending fails", async () => {
    (sendTeacherCredentialsEmail as jest.Mock).mockRejectedValueOnce(new Error("Email service down"));

    const request = new NextRequest("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Teacher",
        email: "teacher@example.com",
        role: "teacher",
        schoolName: "Test School",
        password: "securepassword",
        schoolId: "school123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to send credentials");
    expect(data.message).toBe("Email service down");
    expect(sendTeacherCredentialsEmail).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith("Error sending credentials:", expect.any(Error));
  });
});