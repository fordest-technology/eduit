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

  // Only super_admin and school_admin can remove students from classes
  if (!["super_admin", "school_admin"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const classId = params.id;

  try {
    // Check if the class exists and belongs to the school
    const classFound = await prisma.class.findUnique({
      where: {
        id: classId,
        schoolId: session.schoolId,
      },
    });

    if (!classFound) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Get the student ID from the form data
    const formData = await req.formData();
    const studentId = formData.get("studentId") as string;

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    // Check if the student exists and belongs to the school
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        user: {
          schoolId: session.schoolId,
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Check if the student is in the class
    const studentClass = await prisma.studentClass.findFirst({
      where: {
        studentId,
        classId,
      },
    });

    if (!studentClass) {
      return NextResponse.json(
        { error: "Student is not in this class" },
        { status: 400 }
      );
    }

    // Remove the student from the class
    await prisma.studentClass.delete({
      where: {
        id: studentClass.id,
      },
    });

    eventTrack("student_removed_from_class", {
      userId: session.id,
      schoolId: session.schoolId,
      classId,
      studentId,
    });

    return NextResponse.redirect(
      new URL(`/dashboard/classes/${classId}`, req.url)
    );
  } catch (error) {
    console.error("Error removing student from class:", error);
    return NextResponse.json(
      { error: "Failed to remove student from class" },
      { status: 500 }
    );
  }
}
