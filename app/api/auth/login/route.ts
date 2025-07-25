import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { UserRole } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Missing email or password" },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create session token and set cookie
    const session = await createSession({
      id: user.id,
      email: user.email,
      role: user.role,
      // Include additional user data in the session
      ...(user.schoolId && { schoolId: user.schoolId })
    });

    // Get the response with cookie set
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

    // Copy the Set-Cookie header from the session response
    const cookieHeader = session.headers.get('Set-Cookie');
    if (cookieHeader) {
      response.headers.set('Set-Cookie', cookieHeader);
    }

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
