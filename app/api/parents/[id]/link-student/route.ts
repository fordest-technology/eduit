import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (
      !session ||
      !["super_admin", "school_admin", "teacher"].includes(session.role)
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
      session.role === "school_admin" &&
      parent.schoolId !== session.schoolId
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { studentId } = await request.json();

    if (!studentId) {
      return new NextResponse("Student ID is required", { status: 400 });
    }

    // Check if student exists and belongs to the same school
    const student = await prisma.student.findUnique({
      where: {
        id: studentId,
      },
      include: {
        user: true,
      },
    });

    if (!student) {
      return new NextResponse("Student not found", { status: 404 });
    }

    if (student.user.schoolId !== parent.schoolId) {
      return new NextResponse(
        "Student and parent must belong to the same school",
        { status: 400 }
      );
    }

    // Check if student is already linked to any parent
    const existingLink = await prisma.parentStudent.findFirst({
      where: {
        studentId,
      },
    });

    if (existingLink) {
      return new NextResponse("Student is already linked to another parent", {
        status: 400,
      });
    }

    // Create the parent-student relationship
    const result = await prisma.parentStudent.create({
      data: {
        parentId: parent.parent!.id,
        studentId,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Student linked successfully",
      student: {
        id: result.student.id,
        name: result.student.user.name,
      },
    });
  } catch (error) {
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
    if (!session || !["super_admin", "school_admin"].includes(session.role)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { studentId } = await request.json();

    if (!studentId) {
      return new NextResponse("Student ID is required", { status: 400 });
    }

    // Find and delete the parent-student relationship
    const result = await prisma.parentStudent.deleteMany({
      where: {
        parentId: params.id,
        studentId,
      },
    });

    if (result.count === 0) {
      return new NextResponse("Relationship not found", { status: 404 });
    }

    return NextResponse.json({ message: "Student unlinked successfully" });
  } catch (error) {
    console.error("[PARENT_UNLINK_STUDENT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
