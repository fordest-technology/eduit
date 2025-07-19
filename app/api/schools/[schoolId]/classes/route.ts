import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(
  request: Request,
  { params }: { params: { schoolId: string } }
) {
  const startTime = Date.now();

  try {
    const session = await getSession();
    if (!session) {
      logger.warn("Unauthorized access attempt to school classes API");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to this school
    if (session.schoolId !== params.schoolId) {
      logger.warn("Access denied to school classes", {
        userSchoolId: session.schoolId,
        requestedSchoolId: params.schoolId,
      });
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    logger.info("Fetching school classes", { schoolId: params.schoolId });

    // Get query parameters for filtering
    const url = new URL(request.url);
    const teacherIdParam = url.searchParams.get("teacherId");

    let classes;

    // If teacherId is provided and user is a teacher, only return classes for that teacher
    if (teacherIdParam && session.role === "TEACHER") {
      classes = await prisma.class.findMany({
        where: {
          schoolId: params.schoolId,
          teacherId: teacherIdParam,
        },
        orderBy: { name: "asc" },
        include: {
          level: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } else {
      // For admins or other roles, return all classes
      classes = await prisma.class.findMany({
        where: {
          schoolId: params.schoolId,
        },
        orderBy: { name: "asc" },
        include: {
          level: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }

    const duration = Date.now() - startTime;
    logger.api("GET /api/schools/[schoolId]/classes", duration, {
      schoolId: params.schoolId,
      count: classes.length,
      teacherId: teacherIdParam || null,
    });

    return NextResponse.json(classes);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Error fetching school classes", error, {
      schoolId: params.schoolId,
      duration,
    });
    return NextResponse.json(
      {
        error: "Failed to fetch classes",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
