import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { eventTrack } from "@/lib/events";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only super_admin and school_admin can assign students to departments
  if (!["super_admin", "school_admin"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const studentId = params.id;

  try {
    // Check if the student exists and belongs to the school
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        user: {
          schoolId: session.schoolId,
        },
      },
      include: {
        classes: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (student.departmentId) {
      return NextResponse.json(
        { error: "Student is already assigned to a department" },
        { status: 400 }
      );
    }

    // Get the department ID from the form data
    const formData = await req.formData();
    const departmentId = formData.get("departmentId") as string;

    if (!departmentId) {
      return NextResponse.json(
        { error: "Department ID is required" },
        { status: 400 }
      );
    }

    // Check if the department exists and belongs to the school
    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        schoolId: session.schoolId,
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    // Update the student with the department ID
    await prisma.student.update({
      where: {
        id: studentId,
      },
      data: {
        departmentId,
      },
    });

    // Get all subjects from this department
    const departmentSubjects = await prisma.subject.findMany({
      where: {
        departmentId,
      },
    });

    // Assign all department subjects to the student
    for (const subject of departmentSubjects) {
      // Check if the subject-student relationship already exists
      const existingStudentSubject = await prisma.studentSubject.findUnique({
        where: {
          studentId_subjectId: {
            studentId,
            subjectId: subject.id,
          },
        },
      });

      if (!existingStudentSubject) {
        await prisma.studentSubject.create({
          data: {
            studentId,
            subjectId: subject.id,
          },
        });
      }
    }

    eventTrack("student_assigned_to_department", {
      userId: session.id,
      schoolId: session.schoolId,
      studentId,
      departmentId,
    });

    // Get the class ID if student came from a class detail page
    const referer = req.headers.get("referer") || "";
    const classMatch = referer.match(/\/dashboard\/classes\/([^/]+)/);
    const classId = classMatch ? classMatch[1] : null;

    if (classId) {
      return NextResponse.redirect(
        new URL(`/dashboard/classes/${classId}`, req.url)
      );
    }

    return NextResponse.redirect(
      new URL(`/dashboard/students/${studentId}`, req.url)
    );
  } catch (error) {
    console.error("Error assigning student to department:", error);
    return NextResponse.json(
      { error: "Failed to assign student to department" },
      { status: 500 }
    );
  }
}
