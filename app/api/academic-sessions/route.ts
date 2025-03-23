import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

// Validation schema for academic session
const academicSessionSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  schoolId: z.string().min(1, "School ID is required"),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  isCurrent: z.boolean().optional().default(false),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const schoolId = searchParams.get("schoolId");
    const isCurrent = searchParams.get("isCurrent");
    const active = searchParams.get("active");

    // Build where clause based on user role and filters
    const where: any = {};
    if (session.role === "school_admin") {
      where.schoolId = session.schoolId;
    } else if (schoolId) {
      where.schoolId = schoolId;
    }

    if (isCurrent !== null) {
      where.isCurrent = isCurrent === "true";
    }

    // Add filter for active sessions
    if (active !== null) {
      const isActive = active === "true";

      // Filter based on end date for active sessions
      if (isActive) {
        where.endDate = {
          gte: new Date(),
        };
      } else {
        where.endDate = {
          lt: new Date(),
        };
      }
    }

    // Fetch academic sessions with related data
    const academicSessions = await prisma.academicSession.findMany({
      where,
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
        createdAt: "desc",
      },
    });

    // Add isActive field for backward compatibility
    const formattedSessions = academicSessions.map((session) => ({
      ...session,
      isActive: session.isCurrent,
    }));

    // Return array directly instead of object
    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error("Error fetching academic sessions:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = academicSessionSchema.parse(body);

    // Check if user has permission to create session for this school
    if (
      session.role === "school_admin" &&
      session.schoolId !== validatedData.schoolId
    ) {
      return NextResponse.json(
        { message: "Unauthorized to create session for this school" },
        { status: 403 }
      );
    }

    // If setting as current, update other sessions to not be current
    if (validatedData.isCurrent) {
      await prisma.academicSession.updateMany({
        where: {
          schoolId: validatedData.schoolId,
          isCurrent: true,
        },
        data: {
          isCurrent: false,
        },
      });
    }

    // Create new academic session
    const academicSession = await prisma.academicSession.create({
      data: validatedData,
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
      ...academicSession,
      isActive: academicSession.isCurrent,
    };

    return NextResponse.json(formattedSession, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating academic session:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
