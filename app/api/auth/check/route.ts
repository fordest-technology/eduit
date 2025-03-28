import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({
      authenticated: false,
    });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      role: session.role,
      // Only include necessary user data
      id: session.id,
      email: session.email,
      name: session.name,
    },
  });
}
