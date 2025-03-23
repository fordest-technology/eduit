import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.role !== "super_admin" && session.role !== "school_admin") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { departmentId } = await request.json();

    // Verify student exists and belongs to the same school
    const student = await prisma.user.findFirst({
      where: {
        id: params.id,
        role: "STUDENT",
        schoolId: session.schoolId,
      },
    });

    if (!student) {
      return new NextResponse("Student not found", { status: 404 });
    }

    // Verify department exists and belongs to the same school
    if (departmentId) {
      const department = await prisma.department.findFirst({
        where: {
          id: departmentId,
          schoolId: session.schoolId,
        },
      });

      if (!department) {
        return new NextResponse("Department not found", { status: 404 });
      }
    }

    // Update student's department
    const updatedStudent = await prisma.user.update({
      where: {
        id: params.id,
      },
      data: {
        departmentId,
      },
      select: {
        id: true,
        name: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedStudent);
  } catch (error) {
    console.error("[STUDENT_DEPARTMENT_UPDATE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
