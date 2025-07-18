import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

// Define typed response for better type safety
type ApiResponse<T> = {
  data?: T;
  error?: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request);

    if (!auth.authenticated || !auth.user || !auth.user.schoolId) {
      return NextResponse.json<ApiResponse<never>>(
        { error: "You must be logged in to access this resource" },
        { status: 401 }
      );
    }

    const { user } = auth;
    const classId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");

    console.log("Getting available students for class:", {
      classId,
      sessionId,
    });

    // Verify the class exists and belongs to user's school
    const classRecord = await prisma.class.findUnique({
      where: {
        id: classId,
        schoolId: user.schoolId,
      },
      include: {
        level: true,
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    if (!classRecord) {
      return NextResponse.json<ApiResponse<never>>(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    // If no session specified, try to get current session
    let targetSessionId = sessionId;
    if (!targetSessionId) {
      // First try to get the current session
      const currentSession = await prisma.academicSession.findFirst({
        where: {
          schoolId: user.schoolId,
          isCurrent: true,
        },
      });

      if (currentSession) {
        targetSessionId = currentSession.id;
      } else {
        // If no current session, get the most recent session
        const mostRecentSession = await prisma.academicSession.findFirst({
          where: {
            schoolId: user.schoolId,
          },
          orderBy: {
            endDate: "desc",
          },
        });

        if (mostRecentSession) {
          targetSessionId = mostRecentSession.id;
        } else {
          return NextResponse.json<ApiResponse<never>>(
            {
              error:
                "No academic sessions found. Please create an academic session first.",
            },
            { status: 404 }
          );
        }
      }
    } else {
      // Verify the provided session exists and belongs to the school
      const sessionExists = await prisma.academicSession.findFirst({
        where: {
          id: targetSessionId,
          schoolId: user.schoolId,
        },
      });

      if (!sessionExists) {
        return NextResponse.json<ApiResponse<never>>(
          {
            error: "Invalid session ID provided.",
          },
          { status: 400 }
        );
      }
    }

    console.log(`Fetching students for session: ${targetSessionId}`);

    // Get all students for this school who are not in any class for the session
    const availableStudents = await prisma.student.findMany({
      where: {
        user: {
          schoolId: user.schoolId,
          role: UserRole.STUDENT,
        },
        NOT: {
          classes: {
            some: {
              sessionId: targetSessionId,
            },
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    // Format the student records
    const formattedStudents = availableStudents.map((student) => ({
      id: student.id,
      name: student.user.name,
      email: student.user.email,
      profileImage: student.user.profileImage,
      department: student.department,
    }));

    console.log(`Found ${formattedStudents.length} available students`);

    return NextResponse.json<ApiResponse<typeof formattedStudents>>({
      data: formattedStudents,
    });
  } catch (error) {
    console.error("[AVAILABLE_STUDENTS_GET] Error:", error);
    return NextResponse.json<ApiResponse<never>>(
      { error: "Failed to fetch available students" },
      { status: 500 }
    );
  }
}
