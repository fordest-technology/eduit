import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

// GET a specific class
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request);

    if (!auth.authenticated || !auth.user || !auth.user.schoolId) {
      return NextResponse.json(
        { error: "You must be logged in to access this resource" },
        { status: 401 }
      );
    }

    const { user } = auth;
    const classId = params.id;

    // Get current academic session
    const currentSession = await prisma.academicSession.findFirst({
      where: {
        schoolId: user.schoolId,
        isCurrent: true,
      },
    });

    const classData = await prisma.class.findUnique({
      where: {
        id: classId,
        schoolId: user.schoolId,
      },
      include: {
        teacher: {
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
        },
        level: true,
        subjects: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                department: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        students: {
          where: {
            status: "ACTIVE",
            sessionId: currentSession?.id, // Only get students for current session
          },
          include: {
            student: {
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
            },
          },
          orderBy: {
            student: {
              user: {
                name: "asc",
              },
            },
          },
        },
      },
    });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Format the response to include session info
    const formattedResponse = {
      ...classData,
      currentSession: currentSession
        ? {
            id: currentSession.id,
            name: currentSession.name,
            startDate: currentSession.startDate,
            endDate: currentSession.endDate,
          }
        : null,
    };

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error("[CLASS_GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch class details" },
      { status: 500 }
    );
  }
}

// PATCH to update a class
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request, ["super_admin", "school_admin"]);

    if (!auth.authenticated || !auth.authorized) {
      return NextResponse.json(
        { error: "You are not authorized to perform this action" },
        { status: 403 }
      );
    }

    const { user } = auth;
    const classId = params.id;
    const body = await request.json();

    // Validate the class exists and belongs to the school
    const existingClass = await prisma.class.findUnique({
      where: {
        id: classId,
        schoolId: user.schoolId,
      },
    });

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Update the class
    const updatedClass = await prisma.class.update({
      where: {
        id: classId,
      },
      data: {
        name: body.name,
        section: body.section,
        teacherId: body.teacherId,
        levelId: body.levelId,
      },
      include: {
        level: true,
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedClass);
  } catch (error) {
    console.error("[CLASS_PUT] Error:", error);
    return NextResponse.json(
      { error: "Failed to update class" },
      { status: 500 }
    );
  }
}

// DELETE a class
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request, ["super_admin", "school_admin"]);

    if (!auth.authenticated || !auth.authorized) {
      return NextResponse.json(
        { error: "You are not authorized to perform this action" },
        { status: 403 }
      );
    }

    const { user } = auth;
    const classId = params.id;

    // Validate the class exists and belongs to the school
    const existingClass = await prisma.class.findUnique({
      where: {
        id: classId,
        schoolId: user.schoolId,
      },
    });

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Delete the class
    await prisma.class.delete({
      where: {
        id: classId,
      },
    });

    return NextResponse.json({ message: "Class deleted successfully" });
  } catch (error) {
    console.error("[CLASS_DELETE] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete class" },
      { status: 500 }
    );
  }
}
