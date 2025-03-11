import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

// In a real app, you would store this in an environment variable
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key"
);

export type UserRole =
  | "super_admin"
  | "school_admin"
  | "teacher"
  | "student"
  | "parent";

export interface UserJwtPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  schoolId?: string;
  profileImage?: string;
  [key: string]: any;
}

export async function signJwt(payload: UserJwtPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(JWT_SECRET);

  return token;
}

export async function verifyJwt(token: string): Promise<UserJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as UserJwtPayload;
  } catch (error) {
    console.error("JWT verification error:", error);
    return null;
  }
}

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) return null;

    const payload = await verifyJwt(token);
    return payload;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

export function setSessionCookie(token: string, response: NextResponse) {
  response.cookies.set({
    name: "session",
    value: token,
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8, // 8 hours
  });

  return response;
}

export function removeSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: "session",
    value: "",
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });

  return response;
}

export async function requireAuth(
  request: NextRequest,
  allowedRoles?: UserRole[]
) {
  const token = request.cookies.get("session")?.value;

  if (!token) {
    return { authenticated: false, user: null };
  }

  const user = await verifyJwt(token);

  if (!user) {
    return { authenticated: false, user: null };
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return { authenticated: true, authorized: false, user };
  }

  return { authenticated: true, authorized: true, user };
}
