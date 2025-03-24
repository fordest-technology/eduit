import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { studentId } = await request.json();

    if (!studentId) {
      return new NextResponse("Student ID is required", { status: 400 });
    }

    // Check if the parent exists
    const parent = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: "PARENT",
      },
    });

    if (!parent) {
      return new NextResponse("Parent not found", { status: 404 });
    }

    // Check if the student exists
    const student = await prisma.user.findUnique({
      where: {
        id: studentId,
        role: "STUDENT",
      },
    });

    if (!student) {
      return new NextResponse("Student not found", { status: 404 });
    }

    // Link the student to the parent
    await prisma.studentParent.create({
      data: {
        parentId: params.id,
        studentId: studentId,
      },
    });

    return new NextResponse("Student linked successfully", { status: 200 });
  } catch (error) {
    console.error("[PARENT_STUDENT_LINK]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get all students linked to the parent
    const students = await prisma.studentParent.findMany({
      where: {
        parentId: params.id,
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
            classes: {
              include: {
                class: {
                  select: {
                    id: true,
                    name: true,
                    section: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(students.map((ps) => ps.student));
  } catch (error) {
    console.error("[PARENT_STUDENTS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
