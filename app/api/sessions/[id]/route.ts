import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { serializeBigInts } from "@/lib/utils";

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    const academicSession = await prisma.academicSession.findUnique({
      where: { id: sessionId },
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

    if (!academicSession) {
      return NextResponse.json(
        { error: "Academic session not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to view this session
    if (
      session.role !== "SUPER_ADMIN" &&
      academicSession.schoolId !== session.schoolId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(serializeBigInts(academicSession));
  } catch (error) {
    console.error("Error fetching academic session:", error);

    // Check if it's a connection error
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const isConnectionError = errorMessage.includes(
      "Can't reach database server"
    );

    return NextResponse.json(
      {
        error: "Failed to fetch academic session",
        details: isConnectionError
          ? "Database connection error"
          : "Server error",
        isConnectionError,
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    // Only super_admin and school_admin can update sessions
    const allowedRoles: UserRole[] = ["SUPER_ADMIN", "SCHOOL_ADMIN"];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Find the session first to check permissions
    const existingSession = await prisma.academicSession.findUnique({
      where: { id: sessionId },
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: "Academic session not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to modify this session
    if (
      session.role !== "SUPER_ADMIN" &&
      existingSession.schoolId !== session.schoolId
    ) {
      console.log("Permission denied:", {
        userRole: session.role,
        userSchoolId: session.schoolId,
        sessionSchoolId: existingSession.schoolId,
      });
      return NextResponse.json(
        {
          error: "Forbidden",
          details:
            "You do not have permission to modify sessions from other schools",
        },
        { status: 403 }
      );
    }

    // If setting as current and it's not already current, unset any other current sessions
    if (body.isCurrent === true && !existingSession.isCurrent) {
      await prisma.academicSession.updateMany({
        where: {
          schoolId: existingSession.schoolId,
          isCurrent: true,
          id: { not: sessionId },
        },
        data: {
          isCurrent: false,
        },
      });
    }

    // Update the session
    const updatedSession = await prisma.academicSession.update({
      where: { id: sessionId },
      data: {
        name: body.name,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        isCurrent: body.isCurrent,
        // Ensure schoolId remains unchanged for school_admin
        ...(session.role === "SUPER_ADMIN" && body.schoolId
          ? { schoolId: body.schoolId }
          : {}),
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
      ...updatedSession,
      isActive: updatedSession.isCurrent,
    };

    return NextResponse.json(formattedSession);
  } catch (error) {
    console.error("Error updating academic session:", error);

    // Check if it's a connection error
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const isConnectionError = errorMessage.includes(
      "Can't reach database server"
    );

    return NextResponse.json(
      {
        error: "Failed to update academic session",
        details: isConnectionError
          ? "Database connection error"
          : "Server error",
        isConnectionError,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    // Only SUPER_ADMIN and SCHOOL_ADMIN can delete sessions
    const allowedRoles: UserRole[] = ["SUPER_ADMIN", "SCHOOL_ADMIN"];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find the session first to check permissions
    const existingSession = await prisma.academicSession.findUnique({
      where: { id: sessionId },
      include: {
        _count: {
          select: {
            studentClasses: true,
            attendance: true,
            results: true,
          },
        },
      },
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: "Academic session not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to delete this session
    if (
      session.role !== "SUPER_ADMIN" &&
      existingSession.schoolId !== session.schoolId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if the session has related records
    const relatedRecords =
      existingSession._count.studentClasses +
      existingSession._count.attendance +
      existingSession._count.results;

    if (relatedRecords > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete session with related records",
          counts: {
            studentClasses: existingSession._count.studentClasses,
            attendance: existingSession._count.attendance,
            results: existingSession._count.results,
          },
        },
        { status: 400 }
      );
    }

    // Delete the session and its configurations in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Find all result configurations for this session
      const configs = await tx.resultConfiguration.findMany({
        where: { sessionId },
        select: { id: true },
      });

      const configIds = configs.map((c) => c.id);

      if (configIds.length > 0) {
        // 2. Delete all related records for these configurations
        await tx.gradingScale.deleteMany({
          where: { configurationId: { in: configIds } },
        });

        await tx.assessmentComponent.deleteMany({
          where: { configurationId: { in: configIds } },
        });

        await tx.resultPeriod.deleteMany({
          where: { configurationId: { in: configIds } },
        });

        // 3. Delete the configurations themselves
        await tx.resultConfiguration.deleteMany({
          where: { id: { in: configIds } },
        });
      }

      // 4. Finally delete the session
      await tx.academicSession.delete({
        where: { id: sessionId },
      });
    });

    return NextResponse.json(
      serializeBigInts({ success: true, id: sessionId })
    );
  } catch (error) {
    console.error("Error deleting academic session:", error);

    // Check if it's a connection error
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const isConnectionError = errorMessage.includes(
      "Can't reach database server"
    );

    return NextResponse.json(
      {
        error: "Failed to delete academic session",
        details: isConnectionError
          ? "Database connection error"
          : "Server error",
        isConnectionError,
      },
      { status: 500 }
    );
  }
}
