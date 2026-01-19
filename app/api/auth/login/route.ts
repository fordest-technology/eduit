import { NextResponse } from "next/server";
import { prisma, withErrorHandling } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { sanitizeInput } from "@/lib/security";

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const { email, password } = sanitizeInput(rawBody);

    if (!email || !password) {
      return NextResponse.json({ message: "Missing email or password" }, { status: 400 });
    }

    // Find user using withErrorHandling for robust connectivity
    const user = await withErrorHandling(async () => {
      return await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
    });

    if (!user) {
      console.log(`Login failed: User not found - ${email}`);
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const isMatch = await compare(password, user.password);
    if (!isMatch) {
      console.log(`Login failed: Password mismatch for ${email}`);
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    console.log(`Login successful for ${email} (Role: ${user.role})`);

    // If user is an admin, fetch their permissions
    let permissions = null;
    if (user.role === "SCHOOL_ADMIN" || user.role === "SUPER_ADMIN") {
      const adminRecord = await withErrorHandling(async () => {
        return await prisma.admin.findUnique({
          where: { userId: user.id },
          select: { permissions: true },
        });
      });
      permissions = adminRecord?.permissions;
    }

    // Get request host for cookie domain detection
    const host = request.headers.get("host") || undefined;

    // Generate JWT token
    const { signJwt, setSessionCookie } = await import("@/lib/auth");
    const token = await signJwt({
      id: user.id,
      email: user.email,
      name: user.name || "",
      role: user.role as any,
      schoolId: user.schoolId || undefined,
      profileImage: user.profileImage || undefined,
      permissions,
    });

    // Create the final JSON response
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId || null,
        profileImage: user.profileImage || null,
      },
    });

    // Set the session cookie on the final response
    await setSessionCookie(response, token, host);

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
