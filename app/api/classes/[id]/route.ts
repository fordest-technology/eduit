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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const classDetails = await prisma.class.findUnique({
      where: {
        id: params.id,
        schoolId: auth.user.schoolId,
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
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
            subject: true,
          },
        },
        students: {
          include: {
            student: {
              include: {
                user: {
                  select: {
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
        },
      },
    });

    if (!classDetails) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    return NextResponse.json(classDetails);
  } catch (error) {
    console.error("[CLASS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
    const auth = await requireAuth(request, [
      UserRole.SUPER_ADMIN,
      UserRole.SCHOOL_ADMIN,
    ]);

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
    console.error("[CLASS_PUT]", error);
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
    const auth = await requireAuth(request, [
      UserRole.SUPER_ADMIN,
      UserRole.SCHOOL_ADMIN,
    ]);

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
    console.error("[CLASS_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete class" },
      { status: 500 }
    );
  }
}
