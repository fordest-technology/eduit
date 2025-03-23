import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validate the route params
const routeContextSchema = z.object({
  id: z.string(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!params?.id) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      classId,
      sessionId,
      rollNumber,
      forceReassign = false,
    } = await request.json();

    if (!classId) {
      return NextResponse.json(
        { error: "Class ID is required" },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "Academic session ID is required" },
        { status: 400 }
      );
    }

    // Check if the student exists
    const studentData = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        user: true,
      },
    });

    if (!studentData) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Check if the class exists
    const classRecord = await prisma.class.findUnique({
      where: {
        id: classId,
      },
    });

    if (!classRecord) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Check if the session exists
    const sessionRecord = await prisma.academicSession.findUnique({
      where: {
        id: sessionId,
      },
    });

    if (!sessionRecord) {
      return NextResponse.json(
        { error: "Academic session not found" },
        { status: 404 }
      );
    }

    // Check if the student is already in this class for this session
    const existingEnrollment = await prisma.studentClass.findUnique({
      where: {
        studentId_classId_sessionId: {
          studentId: studentData.id,
          classId,
          sessionId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        {
          error: "Student is already enrolled in this class for this session",
          code: "ALREADY_ENROLLED",
          enrollment: existingEnrollment,
        },
        { status: 409 }
      );
    }

    // Check if student is already in another class for this session
    const existingClassForSession = await prisma.studentClass.findFirst({
      where: {
        studentId: studentData.id,
        sessionId,
        classId: { not: classId },
      },
      include: {
        class: true,
      },
    });

    if (existingClassForSession && !forceReassign) {
      // Student is already in another class for this session
      const currentClass = existingClassForSession.class;
      const fullClassName = `${currentClass.name}${
        currentClass.section ? ` (${currentClass.section})` : ""
      }`;

      return NextResponse.json(
        {
          error: "Student is already in another class for this session",
          code: "STUDENT_IN_OTHER_CLASS",
          details: {
            message: `${studentData.user.name} is already in ${fullClassName} for this session.`,
            currentClassId: currentClass.id,
            studentClassId: existingClassForSession.id,
          },
        },
        { status: 409 }
      );
    }

    // If forceReassign is true and student is in another class, remove them first
    if (existingClassForSession && forceReassign) {
      await prisma.studentClass.delete({
        where: { id: existingClassForSession.id },
      });

      console.log(
        `Removed student ${studentData.id} from class ${existingClassForSession.classId}`
      );
    }

    // Add the student to the class
    const enrollment = await prisma.studentClass.create({
      data: {
        student: {
          connect: {
            id: studentData.id,
          },
        },
        class: {
          connect: {
            id: classId,
          },
        },
        session: {
          connect: {
            id: sessionId,
          },
        },
        rollNumber: rollNumber || null,
      },
      include: {
        class: true,
        session: true,
      },
    });

    // Create friendly class name
    const className = `${enrollment.class.name}${
      enrollment.class.section ? ` (${enrollment.class.section})` : ""
    }`;

    // Create appropriate success message
    const message =
      existingClassForSession && forceReassign
        ? `${studentData.user.name} has been moved to ${className}`
        : `${studentData.user.name} has been added to ${className}`;

    return NextResponse.json(
      {
        message,
        enrollment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[STUDENT_CLASS_ADD]", error);
    return NextResponse.json(
      {
        error: "Failed to add student to class",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the student's class enrollments
    const student = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: "STUDENT",
      },
      include: {
        student: {
          include: {
            classes: {
              include: {
                class: true,
                session: true,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (!student.student) {
      return NextResponse.json(
        { error: "Student record not found" },
        { status: 404 }
      );
    }

    // Find the current academic session
    const currentSession = await prisma.academicSession.findFirst({
      where: {
        isCurrent: true,
      },
    });

    // Filter enrollments for the current session if it exists
    let currentEnrollments = student.student.classes;
    if (currentSession) {
      currentEnrollments = student.student.classes.filter(
        (enrollment) => enrollment.sessionId === currentSession.id
      );
    }

    return NextResponse.json({
      enrollments: student.student.classes,
      currentEnrollments,
      currentSession,
    });
  } catch (error) {
    console.error("[STUDENT_CLASS_GET]", error);
    return NextResponse.json(
      {
        error: "Failed to get student class enrollments",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
