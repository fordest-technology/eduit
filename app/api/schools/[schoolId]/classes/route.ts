import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { schoolId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to this school
    if (session.schoolId !== params.schoolId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

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

    return NextResponse.json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch classes",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
