import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(null, { status: 401 });
  }

  // Return the session without sensitive information
  return NextResponse.json({
    id: session.id,
    name: session.name,
    email: session.email,
    role: session.role,
    schoolId: session.schoolId,
    profileImage: session.profileImage,
    permissions: session.permissions,
  });
}
