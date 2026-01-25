import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const startTime = Date.now();
  const { schoolId } = await params;

  try {
    const session = await getSession();
    if (!session) {
      logger.warn("Unauthorized access attempt to school classes API");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to this school
    if (session.schoolId !== schoolId) {
      logger.warn("Access denied to school classes", {
        userSchoolId: session.schoolId,
        requestedSchoolId: schoolId,
      });
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    logger.info("Fetching school classes", { schoolId: schoolId });

    let schoolClasses = [];

    // Check if user is a teacher and filter classes
    if (session.role === "TEACHER") {
      // Find the teacher profile for this user
      const teacherProfile = await prisma.teacher.findFirst({
        where: {
          userId: session.id,
        },
      });

      if (!teacherProfile) {
        logger.warn("Teacher profile not found for user", { userId: session.id });
        return NextResponse.json([]);
      }

      schoolClasses = await prisma.class.findMany({
        where: {
          schoolId: schoolId,
          OR: [
            // 1. Is Form Teacher
            { teacherId: teacherProfile.id },
            // 2. Is Subject Teacher for this class
            {
              subjects: {
                some: {
                  subject: {
                    teachers: {
                      some: {
                        teacherId: teacherProfile.id,
                      },
                    },
                  },
                },
              },
            },
          ],
        },
        orderBy: { name: "asc" },
        include: {
          level: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: { students: true }
          }
        },
      });
    } else {
      // For admins or other roles, return all classes
      schoolClasses = await prisma.class.findMany({
        where: {
          schoolId: schoolId,
        },
        orderBy: { name: "asc" },
        include: {
          level: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: { students: true }
          }
        },
      });
    }

    // Transform to include studentCount from _count
    const transformedClasses = schoolClasses.map(c => ({
      ...c,
      studentCount: c._count.students
    }));

    const duration = Date.now() - startTime;
    logger.api("GET /api/schools/[schoolId]/classes", duration, {
      schoolId: schoolId,
      count: schoolClasses.length,
      role: session.role,
    });

    return NextResponse.json(transformedClasses);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Error fetching school classes", error, {
      schoolId: schoolId,
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
