import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const classId = searchParams.get("classId");
    const sessionId = searchParams.get("sessionId");
    const studentId = searchParams.get("studentId");

    // Validate required parameters
    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Build where clause based on user role and parameters
    const where: any = {
      sessionId,
    };

    // Add date filter if provided
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Filter by student ID if provided or if user is a student/parent
    if (studentId) {
      where.studentId = studentId;
    } else if (session.role === "student") {
      where.studentId = session.id;
    } else if (session.role === "parent") {
      // Get parent's children
      const children = await prisma.studentParent.findMany({
        where: { parentId: session.id },
        select: { studentId: true },
      });

      if (children.length === 0) {
        return NextResponse.json(
          { error: "No children found for this parent" },
          { status: 404 }
        );
      }

      where.studentId = { in: children.map((child) => child.studentId) };
    }

    // Filter by class if provided or if user is a teacher
    if (classId) {
      where.student = {
        studentClass: {
          some: {
            classId,
            sessionId,
          },
        },
      };
    } else if (session.role === "teacher") {
      where.student = {
        studentClass: {
          some: {
            class: {
              teacherId: session.id,
            },
            sessionId,
          },
        },
      };
    }

    // Add school filter for school admins and teachers
    if (session.role === "school_admin" || session.role === "teacher") {
      where.student = {
        ...where.student,
        schoolId: session.schoolId,
      };
    }

    // Fetch attendance records with optimized includes
    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            studentClass: {
              where: {
                sessionId,
              },
              select: {
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
      orderBy: [{ date: "desc" }, { student: { name: "asc" } }],
    });

    // Transform the data to include class information
    const formattedAttendance = attendance.map((record) => ({
      ...record,
      student: {
        ...record.student,
        class: record.student.studentClass[0]?.class.name,
        section: record.student.studentClass[0]?.class.section,
      },
    }));

    return NextResponse.json(formattedAttendance);
  } catch (error) {
    console.error("[ATTENDANCE_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (
    !session ||
    (session.role !== "teacher" &&
      session.role !== "school_admin" &&
      session.role !== "super_admin")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { records } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "Invalid attendance records" },
        { status: 400 }
      );
    }

    // Validate all records have required fields
    const isValid = records.every(
      (record) =>
        record.studentId && record.date && record.status && record.sessionId
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Missing required fields in attendance records" },
        { status: 400 }
      );
    }

    // Create all attendance records in a transaction
    const result = await prisma.$transaction(
      records.map((record) =>
        prisma.attendance.create({
          data: {
            studentId: record.studentId,
            date: new Date(record.date),
            status: record.status,
            sessionId: record.sessionId,
            remarks: record.remarks || "",
          },
        })
      )
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ATTENDANCE_POST]", error);
    return NextResponse.json(
      { error: "Failed to create attendance records" },
      { status: 500 }
    );
  }
}
