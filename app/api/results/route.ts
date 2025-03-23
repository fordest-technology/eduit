import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const subjectId = searchParams.get("subjectId");
    const studentId = searchParams.get("studentId");
    const sessionId = searchParams.get("sessionId");

    // Build where clause based on query parameters
    const where: any = {};
    if (classId) where.classId = classId;
    if (subjectId) where.subjectId = subjectId;
    if (studentId) where.studentId = studentId;
    if (sessionId) where.sessionId = sessionId;

    // If user is a student, only show their own results
    if (session.role === "student") {
      const student = await prisma.student.findUnique({
        where: { userId: session.id },
      });
      if (student) {
        where.studentId = student.id;
      }
    }

    // If user is a parent, only show their children's results
    if (session.role === "parent") {
      const parent = await prisma.parent.findUnique({
        where: { userId: session.id },
        include: {
          children: {
            include: {
              student: true,
            },
          },
        },
      });
      if (parent) {
        where.studentId = {
          in: parent.children.map((child) => child.student.id),
        };
      }
    }

    // If user is a teacher, only show results for their classes
    if (session.role === "teacher") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.id },
        include: {
          classes: true,
        },
      });
      if (teacher) {
        where.classId = {
          in: teacher.classes.map((cls) => cls.id),
        };
      }
    }

    // If user is a school admin, only show results for their school
    if (session.role === "school_admin") {
      const admin = await prisma.admin.findUnique({
        where: { userId: session.id },
        include: {
          user: true,
        },
      });
      if (admin?.user.schoolId) {
        where.student = {
          user: {
            schoolId: admin.user.schoolId,
          },
        };
      }
    }

    const results = await prisma.result.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        subject: true,
        session: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the results to include student name from the user relation
    const transformedResults = results.map((result) => ({
      ...result,
      student: {
        ...result.student,
        name: result.student.user.name,
      },
    }));

    return NextResponse.json(transformedResults);
  } catch (error) {
    console.error("Error fetching results:", error);
    return NextResponse.json(
      { message: "Failed to fetch results" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only teachers and admins can create results
    if (!["teacher", "super_admin", "school_admin"].includes(session.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const data = await request.json();
    const {
      studentId,
      subjectId,
      sessionId,
      examType,
      marks,
      totalMarks,
      grade,
      remarks,
    } = data;

    // Validate required fields
    if (
      !studentId ||
      !subjectId ||
      !sessionId ||
      !examType ||
      marks === undefined ||
      totalMarks === undefined
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // If user is a teacher, verify they teach this subject
    if (session.role === "teacher") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.id },
        include: {
          subjects: true,
        },
      });

      if (!teacher?.subjects.some((st) => st.subjectId === subjectId)) {
        return NextResponse.json(
          { message: "You can only create results for subjects you teach" },
          { status: 403 }
        );
      }
    }

    // If user is a school admin, verify the student belongs to their school
    if (session.role === "school_admin") {
      const admin = await prisma.admin.findUnique({
        where: { userId: session.id },
        include: {
          user: true,
        },
      });

      if (admin?.user.schoolId) {
        const student = await prisma.student.findUnique({
          where: { id: studentId },
          include: {
            user: true,
          },
        });

        if (student?.user.schoolId !== admin.user.schoolId) {
          return NextResponse.json(
            {
              message:
                "You can only create results for students in your school",
            },
            { status: 403 }
          );
        }
      }
    }

    const result = await prisma.result.create({
      data: {
        studentId,
        subjectId,
        sessionId,
        examType,
        marks,
        totalMarks,
        grade,
        remarks,
        isApproved:
          session.role === "super_admin" || session.role === "school_admin",
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        subject: true,
        session: true,
      },
    });

    // Transform the result to include student name from the user relation
    const transformedResult = {
      ...result,
      student: {
        ...result.student,
        name: result.student.user.name,
      },
    };

    return NextResponse.json(transformedResult);
  } catch (error) {
    console.error("Error creating result:", error);
    return NextResponse.json(
      { message: "Failed to create result" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only teachers and admins can update results
    if (!["teacher", "super_admin", "school_admin"].includes(session.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const data = await request.json();
    const { id, marks, totalMarks, grade, remarks, isApproved } = data;

    if (!id) {
      return NextResponse.json(
        { message: "Result ID is required" },
        { status: 400 }
      );
    }

    // If user is a teacher, verify they teach this subject
    if (session.role === "teacher") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.id },
        include: {
          subjects: true,
        },
      });

      const result = await prisma.result.findUnique({
        where: { id },
        include: {
          subject: true,
        },
      });

      if (
        !result ||
        !teacher?.subjects.some((st) => st.subjectId === result.subjectId)
      ) {
        return NextResponse.json(
          { message: "You can only update results for subjects you teach" },
          { status: 403 }
        );
      }
    }

    // If user is a school admin, verify the result belongs to their school
    if (session.role === "school_admin") {
      const admin = await prisma.admin.findUnique({
        where: { userId: session.id },
        include: {
          user: true,
        },
      });

      if (admin?.user.schoolId) {
        const result = await prisma.result.findUnique({
          where: { id },
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        });

        if (result?.student.user.schoolId !== admin.user.schoolId) {
          return NextResponse.json(
            {
              message:
                "You can only update results for students in your school",
            },
            { status: 403 }
          );
        }
      }
    }

    const result = await prisma.result.update({
      where: { id },
      data: {
        marks,
        totalMarks,
        grade,
        remarks,
        isApproved,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        subject: true,
        session: true,
      },
    });

    // Transform the result to include student name from the user relation
    const transformedResult = {
      ...result,
      student: {
        ...result.student,
        name: result.student.user.name,
      },
    };

    return NextResponse.json(transformedResult);
  } catch (error) {
    console.error("Error updating result:", error);
    return NextResponse.json(
      { message: "Failed to update result" },
      { status: 500 }
    );
  }
}
