import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authorize user session with proper roles
    const auth = await requireAuth(request, [
      "super_admin",
      "school_admin",
      "teacher",
    ]);

    if (!auth.authenticated || !auth.authorized || !auth.user) {
      return NextResponse.json(
        { error: "You are not authorized to perform this action" },
        { status: 403 }
      );
    }

    const { user } = auth;
    const classId = params.id;

    // Get data from form
    const formData = await request.formData();
    const studentId = formData.get("studentId") as string;
    const sessionId = formData.get("sessionId") as string;
    const rollNumber = formData.get("rollNumber") as string | null;
    const forceReassign = formData.get("forceReassign") === "true";

    console.log("Add student to class:", {
      classId,
      studentId,
      sessionId,
      rollNumber,
      forceReassign,
      userRole: user.role,
      userSchoolId: user.schoolId,
    });

    // Validate required fields
    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "Academic session ID is required" },
        { status: 400 }
      );
    }

    // Verify the class exists
    const classRecord = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        school: true,
        teacher: true,
        level: true,
        subjects: true,
        students: true,
      },
    });

    if (!classRecord) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Verify user has permission to modify this class
    const schoolId = classRecord.schoolId;
    if (user.schoolId !== schoolId) {
      return NextResponse.json(
        { error: "You don't have permission to modify this class" },
        { status: 403 }
      );
    }

    // If user is a teacher, verify they are assigned to this class
    if (user.role === "teacher" && classRecord.teacherId !== user.teacherId) {
      return NextResponse.json(
        { error: "You don't have permission to modify this class" },
        { status: 403 }
      );
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Check if student is already in another class for this session
    const existingAssignment = await prisma.studentClass.findFirst({
      where: {
        studentId,
        sessionId,
        class: {
          id: { not: classId },
        },
      },
      include: {
        class: true,
      },
    });

    if (existingAssignment && !forceReassign) {
      // Student is already in a class for this session
      const currentClass = existingAssignment.class;
      const fullClassName = `${currentClass.name}${
        currentClass.section ? ` - ${currentClass.section}` : ""
      }`;

      return NextResponse.json(
        {
          success: false,
          error: "Student is already in another class for this session",
          code: "STUDENT_IN_OTHER_CLASS",
          details: {
            message: `${student.user.name} is already in ${fullClassName} for this session.`,
            currentClassId: currentClass.id,
            studentClassId: existingAssignment.id,
          },
        },
        { status: 409 }
      );
    }

    // Check if student is already in this class for this session
    const existingInThisClass = await prisma.studentClass.findFirst({
      where: {
        studentId,
        classId,
        sessionId,
      },
    });

    if (existingInThisClass) {
      return NextResponse.json(
        { error: "Student is already in this class for this session" },
        { status: 400 }
      );
    }

    // Handle reassignment if needed
    if (existingAssignment && forceReassign) {
      // Delete the existing assignment first
      await prisma.studentClass.delete({
        where: { id: existingAssignment.id },
      });

      console.log(
        `Removed student ${studentId} from class ${existingAssignment.classId}`
      );
    }

    // Create the new student-class record
    const studentClass = await prisma.studentClass.create({
      data: {
        studentId,
        classId,
        sessionId,
        rollNumber: rollNumber || undefined,
      },
      include: {
        student: { include: { user: true } },
        class: true,
      },
    });

    const className = `${studentClass.class.name}${
      studentClass.class.section ? ` - ${studentClass.class.section}` : ""
    }`;
    const successMessage =
      forceReassign && existingAssignment
        ? `${student.user.name} has been moved to ${className}`
        : `${student.user.name} has been added to ${className}`;

    return NextResponse.json({
      success: true,
      message: successMessage,
      data: studentClass,
    });
  } catch (error) {
    console.error("Error adding student to class:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to add student to class";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
