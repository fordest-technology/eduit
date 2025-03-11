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
    const attendanceId = params.id;

    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            schoolId: true,
            studentClass: {
              where: {
                session: {
                  isCurrent: true,
                },
              },
              select: {
                class: {
                  select: {
                    id: true,
                    name: true,
                    section: true,
                    teacherId: true,
                  },
                },
              },
            },
          },
        },
        session: {
          select: {
            id: true,
            name: true,
            schoolId: true,
          },
        },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to view this attendance record
    if (session.role === "student") {
      if (attendance.studentId !== session.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.role === "parent") {
      const isParentOfStudent = await prisma.studentParent.findFirst({
        where: {
          parentId: session.id,
          studentId: attendance.studentId,
        },
      });
      if (!isParentOfStudent) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.role === "teacher") {
      const teachesStudent = await prisma.studentClass.findFirst({
        where: {
          studentId: attendance.studentId,
          sessionId: attendance.sessionId,
          class: {
            teacherId: session.id,
          },
        },
      });
      if (!teachesStudent) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.role === "school_admin") {
      if (attendance.student.schoolId !== session.schoolId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Error fetching attendance record:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance record" },
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
      session.role !== "teacher")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const attendanceId = params.id;
    const body = await request.json();
    const { status, remarks } = body;

    // Validate status enum
    if (!["PRESENT", "ABSENT", "LATE", "EXCUSED"].includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status: ${status}. Must be one of: PRESENT, ABSENT, LATE, EXCUSED`,
        },
        { status: 400 }
      );
    }

    // Check if attendance record exists
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        student: {
          select: {
            schoolId: true,
          },
        },
      },
    });

    if (!existingAttendance) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      );
    }

    // Check permissions
    if (session.role === "school_admin") {
      if (existingAttendance.student.schoolId !== session.schoolId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.role === "teacher") {
      const teachesStudent = await prisma.studentClass.findFirst({
        where: {
          studentId: existingAttendance.studentId,
          sessionId: existingAttendance.sessionId,
          class: {
            teacherId: session.id,
          },
        },
      });
      if (!teachesStudent) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Update attendance record
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        status,
        remarks,
      },
      include: {
        student: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedAttendance);
  } catch (error) {
    console.error("Error updating attendance record:", error);
    return NextResponse.json(
      { error: "Failed to update attendance record" },
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
    const attendanceId = params.id;

    // Check if attendance record exists
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        student: {
          select: {
            schoolId: true,
          },
        },
      },
    });

    if (!existingAttendance) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      );
    }

    // Check if school admin has permission
    if (
      session.role === "school_admin" &&
      existingAttendance.student.schoolId !== session.schoolId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete attendance record
    await prisma.attendance.delete({
      where: { id: attendanceId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting attendance record:", error);
    return NextResponse.json(
      { error: "Failed to delete attendance record" },
      { status: 500 }
    );
  }
}
