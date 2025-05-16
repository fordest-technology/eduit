import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession, type UserRole } from "@/lib/auth";

// Helper function to convert BigInt values to numbers for serialization
function serializeBigInts(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "bigint") {
    return Number(data);
  }

  if (Array.isArray(data)) {
    return data.map((item) => serializeBigInts(item));
  }

  if (typeof data === "object") {
    const result: any = {};
    for (const key in data) {
      result[key] = serializeBigInts(data[key]);
    }
    return result;
  }

  return data;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    const { searchParams } = new URL(request.url);
    const schoolId =
      session.role === "super_admin"
        ? searchParams.get("schoolId") || undefined
        : session.schoolId;
    const isCurrent =
      searchParams.get("isCurrent") === "true" ? true : undefined;

    const academicSessions = await prisma.academicSession.findMany({
      where: {
        schoolId: schoolId as string,
        ...(isCurrent !== undefined ? { isCurrent } : {}),
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            studentClasses: true,
            attendance: true,
            results: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    return NextResponse.json(serializeBigInts(academicSessions));
  } catch (error) {
    console.error("Error fetching academic sessions:", error);

    // Check if it's a connection error
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const isConnectionError = errorMessage.includes(
      "Can't reach database server"
    );

    return NextResponse.json(
      {
        error: "Failed to fetch academic sessions",
        details: isConnectionError
          ? "Database connection error"
          : "Server error",
        isConnectionError,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only super_admin and school_admin can create sessions
    const allowedRoles: UserRole[] = ["SUPER_ADMIN", "SCHOOL_ADMIN"];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, startDate, endDate, schoolId } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Determine the school ID based on user role
    const effectiveSchoolId =
      session.role === "SUPER_ADMIN" ? schoolId : session.schoolId;

    if (!effectiveSchoolId) {
      return NextResponse.json(
        { error: "School ID is required" },
        { status: 400 }
      );
    }

    // Validate dates
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (endDateObj <= startDateObj) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Create new session
    const newSession = await prisma.academicSession.create({
      data: {
        name,
        startDate: startDateObj,
        endDate: endDateObj,
        isCurrent: body.isCurrent || false,
        school: {
          connect: { id: effectiveSchoolId },
        },
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            studentClasses: true,
            attendance: true,
            results: true,
          },
        },
      },
    });

    // Add isActive field for backward compatibility
    const formattedSession = {
      ...newSession,
      isActive: newSession.isCurrent,
    };

    return NextResponse.json(formattedSession);
  } catch (error) {
    console.error("Error creating academic session:", error);

    // Check if it's a connection error
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const isConnectionError = errorMessage.includes(
      "Can't reach database server"
    );

    return NextResponse.json(
      {
        error: "Failed to create academic session",
        details: isConnectionError
          ? "Database connection error"
          : "Server error",
        isConnectionError,
      },
      { status: 500 }
    );
  }
}
