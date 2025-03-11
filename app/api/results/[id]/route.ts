import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resultId = params.id;

    const result = await prisma.result.findUnique({
      where: { id: resultId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            schoolId: true,
          },
        },
        subject: true,
        session: true,
      },
    });

    if (!result) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    // Check if user has permission to view this result
    if (session.role === "STUDENT") {
      // Students can only view their own approved results
      if (result.studentId !== session.id || !result.isApproved) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.role === "PARENT") {
      // Parents can only view their children's approved results
      const isParentOfStudent = await prisma.studentParent.findFirst({
        where: {
          parentId: session.id,
          studentId: result.studentId,
        },
      });

      if (!isParentOfStudent || !result.isApproved) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.role === "TEACHER") {
      // Teachers can only view results for subjects they teach
      const teacherSubject = await prisma.subjectTeacher.findFirst({
        where: {
          teacherId: session.id,
          subjectId: result.subjectId,
        },
      });

      if (!teacherSubject) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.role === "SCHOOL_ADMIN") {
      // School admins can only view results for students in their school
      if (result.student.schoolId !== session.schoolId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching result:", error);
    return NextResponse.json(
      { error: "Failed to fetch result" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();

  if (
    !session ||
    (session.role !== "super_admin" &&
      session.role !== "school_admin" &&
      session.role !== "TEACHER")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resultId = params.id;
    const body = await request.json();
    const { marks, totalMarks, remarks, isApproved } = body;

    // Check if result exists
    const existingResult = await prisma.result.findUnique({
      where: { id: resultId },
      include: {
        student: {
          select: { schoolId: true },
        },
      },
    });

    if (!existingResult) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    // Check if user has permission to update this result
    if (session.role === "TEACHER") {
      // Teachers can only update results for subjects they teach
      const teacherSubject = await prisma.subjectTeacher.findFirst({
        where: {
          teacherId: session.id,
          subjectId: existingResult.subjectId,
        },
      });

      if (!teacherSubject) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Teachers cannot approve results
      if (isApproved !== undefined) {
        return NextResponse.json(
          { error: "Teachers cannot approve results" },
          { status: 403 }
        );
      }
    } else if (session.role === "SCHOOL_ADMIN") {
      // School admins can only update results for students in their school
      if (existingResult.student.schoolId !== session.schoolId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (marks !== undefined && totalMarks !== undefined) {
      updateData.marks = marks;
      updateData.totalMarks = totalMarks;

      // Recalculate grade
      const percentage = (marks / totalMarks) * 100;

      if (percentage >= 90) {
        updateData.grade = "A+";
      } else if (percentage >= 80) {
        updateData.grade = "A";
      } else if (percentage >= 70) {
        updateData.grade = "B";
      } else if (percentage >= 60) {
        updateData.grade = "C";
      } else if (percentage >= 50) {
        updateData.grade = "D";
      } else {
        updateData.grade = "F";
      }
    } else if (marks !== undefined || totalMarks !== undefined) {
      return NextResponse.json(
        { error: "Both marks and totalMarks must be provided together" },
        { status: 400 }
      );
    }

    if (remarks !== undefined) {
      updateData.remarks = remarks;
    }

    // Only school admins and super admins can approve results
    if (
      isApproved !== undefined &&
      (session.role === "SCHOOL_ADMIN" || session.role === "super_admin")
    ) {
      updateData.isApproved = isApproved;
    }

    // Update result
    const result = await prisma.result.update({
      where: { id: resultId },
      data: updateData,
      include: {
        student: {
          select: {
            id: true,
            name: true,
          },
        },
        subject: true,
        session: true,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating result:", error);
    return NextResponse.json(
      { error: "Failed to update result" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();

  if (
    !session ||
    (session.role !== "super_admin" && session.role !== "school_admin")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resultId = params.id;

    // Check if result exists
    const existingResult = await prisma.result.findUnique({
      where: { id: resultId },
      include: {
        student: {
          select: { schoolId: true },
        },
      },
    });

    if (!existingResult) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    // Check if user has permission to delete this result
    if (session.role === "SCHOOL_ADMIN") {
      // School admins can only delete results for students in their school
      if (existingResult.student.schoolId !== session.schoolId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Delete result
    await prisma.result.delete({
      where: { id: resultId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting result:", error);
    return NextResponse.json(
      { error: "Failed to delete result" },
      { status: 500 }
    );
  }
}
