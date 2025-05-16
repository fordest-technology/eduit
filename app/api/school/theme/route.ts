import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // 1. Authentication & Authorization
    const session = await getSession(null);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { admin: true },
    });

    if (!user?.schoolId) {
      return NextResponse.json(
        { error: "User not associated with a school" },
        { status: 403 }
      );
    }

    // 2. Fetch school theme
    const school = await prisma.school.findUnique({
      where: { id: user.schoolId },
      select: {
        primaryColor: true,
        secondaryColor: true,
      },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    return NextResponse.json({
      primaryColor: school.primaryColor || "#0091FF",
      secondaryColor: school.secondaryColor || "#E5F3FF",
    });
  } catch (error) {
    console.error("Error fetching school theme:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch school theme",
        ...(process.env.NODE_ENV === "development" && {
          stack: error instanceof Error ? error.stack : undefined,
          details: error,
        }),
      },
      { status: 500 }
    );
  }
}
