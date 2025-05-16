import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { z } from "zod";

// Validation schema for linking student
const linkStudentSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  relation: z.string().min(1, "Relation is required"),
  isPrimary: z.boolean().optional().default(false),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (
      !session ||
      ![UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER].includes(
        session.role
      )
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the parent
    const parent = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: UserRole.PARENT,
      },
      include: {
        parent: true,
      },
    });

    if (!parent) {
      return new NextResponse("Parent not found", { status: 404 });
    }

    // If school_admin, check if the parent belongs to their school
    if (
      session.role === UserRole.SCHOOL_ADMIN &&
      parent.schoolId !== session.schoolId
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Validate request body
    const body = await request.json();
    const validatedData = linkStudentSchema.parse(body);

    // Check if student exists and belongs to the same school
    const student = await prisma.user.findUnique({
      where: {
        id: validatedData.studentId,
        role: UserRole.STUDENT,
      },
      include: {
        student: true,
      },
    });

    if (!student) {
      return new NextResponse("Student not found", { status: 404 });
    }

    if (student.schoolId !== parent.schoolId) {
      return new NextResponse(
        "Student and parent must belong to the same school",
        { status: 400 }
      );
    }

    // Check if student is already linked to this or another parent
    const existingLink = await prisma.studentParent.findFirst({
      where: {
        student: {
          userId: student.id,
        },
      },
    });

    if (existingLink) {
      return new NextResponse("Student is already linked to a parent", {
        status: 400,
      });
    }

    // Create the parent-student relationship
    const result = await prisma.studentParent.create({
      data: {
        studentId: student.student!.id,
        parentId: parent.parent!.id,
        relation: validatedData.relation,
        isPrimary: validatedData.isPrimary,
      },
      include: {
        student: {
          include: {
            user: true,
            classes: {
              include: {
                class: true,
              },
            },
          },
        },
      },
    });

    // Format the response
    const studentClasses = result.student.classes || [];
    const currentClass =
      studentClasses.length > 0 ? studentClasses[0].class.name : "Not assigned";

    return NextResponse.json({
      id: result.student.user.id,
      name: result.student.user.name,
      class: currentClass,
      relation: result.relation,
      linkId: result.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("[PARENT_LINK_STUDENT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (
      !session ||
      ![UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER].includes(
        session.role
      )
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(request.url);
    const linkId = url.searchParams.get("linkId");

    if (!linkId) {
      return new NextResponse("Link ID is required", { status: 400 });
    }

    // Get the relationship to check permissions
    const relationship = await prisma.studentParent.findUnique({
      where: { id: linkId },
      include: {
        parent: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!relationship) {
      return new NextResponse("Relationship not found", { status: 404 });
    }

    // Check if user has permission to manage this relationship
    if (
      session.role === UserRole.SCHOOL_ADMIN &&
      relationship.parent.user.schoolId !== session.schoolId
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Delete the relationship
    await prisma.studentParent.delete({
      where: { id: linkId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[PARENT_UNLINK_STUDENT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
