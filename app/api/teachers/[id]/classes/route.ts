import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateClassesSchema = z.object({
  classIds: z.array(z.string()),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const teacherId = params.id;

    // Validate teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
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
      return new NextResponse("Teacher not found", { status: 404 });
    }

    // Check permissions for non-admin users
    if (
      session.role !== "super_admin" &&
      session.role !== "school_admin" &&
      session.role === "teacher" &&
      session.teacherId !== teacherId
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    return NextResponse.json({
      success: true,
      classes: teacher.classes,
    });
  } catch (error) {
    console.error("[TEACHER_CLASSES_GET]", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal error",
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
    if (!session || !["super_admin", "school_admin"].includes(session.role)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const teacherId = params.id;
    const body = await request.json();

    const { classIds } = updateClassesSchema.parse(body);

    // Validate teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { classes: true },
    });

    if (!teacher) {
      return new NextResponse("Teacher not found", { status: 404 });
    }

    // Get the current class IDs assigned to the teacher
    const currentClassIds = teacher.classes.map((c) => c.id);

    // Find classes to add and remove
    const classesToAdd = classIds.filter((id) => !currentClassIds.includes(id));
    const classesToRemove = currentClassIds.filter(
      (id) => !classIds.includes(id)
    );

    // Update the teacher's classes
    const updatedTeacher = await prisma.teacher.update({
      where: { id: teacherId },
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
    console.error("[TEACHER_CLASSES_PUT]", error);
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 });
    }
    return new NextResponse(
      error instanceof Error ? error.message : "Internal error",
      { status: 500 }
    );
  }
}
