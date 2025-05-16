import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@prisma/client";

const updateClassesSchema = z.object({
  classIds: z.array(z.string()),
});

const isAdmin = (role: UserRole) => {
  return role === UserRole.SUPER_ADMIN || role === UserRole.SCHOOL_ADMIN;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!params?.id) {
      return NextResponse.json(
        { error: "Teacher ID is required" },
        { status: 400 }
      );
    }

    // Find teacher and their classes
    const teacher = await prisma.teacher.findUnique({
      where: {
        id: params.id,
        user: {
          schoolId: session.schoolId,
        },
      },
      include: {
        classes: {
          include: {
            level: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Check permissions for non-admin users
    const hasAccess =
      isAdmin(session.role) ||
      (session.role === UserRole.TEACHER && session.teacherId === params.id);

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      classes: teacher.classes,
    });
  } catch (error) {
    console.error("[TEACHER_CLASSES_GET]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate teacher ID
    if (!params?.id) {
      return NextResponse.json(
        { error: "Teacher ID is required" },
        { status: 400 }
      );
    }

    // Check if user has required permissions
    if (!isAdmin(session.role)) {
      return NextResponse.json(
        { error: "Only administrators can manage teacher classes" },
        { status: 403 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Validate request data
    try {
      const { classIds } = updateClassesSchema.parse(body);

      // Validate teacher exists and belongs to the same school
      const teacher = await prisma.teacher.findUnique({
        where: {
          id: params.id,
          user: {
            schoolId: session.schoolId,
          },
        },
        include: {
          classes: true,
          user: {
            select: {
              schoolId: true,
            },
          },
        },
      });

      if (!teacher) {
        return NextResponse.json(
          { error: "Teacher not found or not in your school" },
          { status: 404 }
        );
      }

      // Verify all classes belong to the same school
      const classes = await prisma.class.findMany({
        where: {
          id: {
            in: classIds,
          },
          schoolId: session.schoolId,
        },
      });

      if (classes.length !== classIds.length) {
        return NextResponse.json(
          {
            error: "Some classes do not exist or do not belong to your school",
          },
          { status: 400 }
        );
      }

      // Get the current class IDs assigned to the teacher
      const currentClassIds = teacher.classes.map((c) => c.id);

      // Find classes to add and remove
      const classesToAdd = classIds.filter(
        (id) => !currentClassIds.includes(id)
      );
      const classesToRemove = currentClassIds.filter(
        (id) => !classIds.includes(id)
      );

      // Update the teacher's classes
      const updatedTeacher = await prisma.teacher.update({
        where: { id: params.id },
        data: {
          classes: {
            connect: classesToAdd.map((id) => ({ id })),
            disconnect: classesToRemove.map((id) => ({ id })),
          },
        },
        include: {
          classes: {
            include: {
              level: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        classes: updatedTeacher.classes,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid request data format" },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("[TEACHER_CLASSES_PUT]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
