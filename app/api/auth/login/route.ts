import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Missing email or password" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !(await compare(password, user.password))) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // If user is an admin, fetch their permissions
    let permissions = null;
    if (user.role === "SCHOOL_ADMIN" || user.role === "SUPER_ADMIN") {
      const adminRecord = await prisma.admin.findUnique({
        where: { userId: user.id },
        select: { permissions: true },
      });
      permissions = adminRecord?.permissions;
    }

    // build JWT & cookie
    const session = await createSession({
      id: user.id,
      email: user.email,
      role: user.role,
      ...(user.schoolId && { schoolId: user.schoolId }),
      permissions,
    } as any);

    // copy cookie into our response
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

    const cookieHeader = session.headers.get("Set-Cookie");
    if (cookieHeader) response.headers.set("Set-Cookie", cookieHeader);

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}