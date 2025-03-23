import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

const updateSubjectsSchema = z.object({
  subjectIds: z.array(z.string()),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const teacherId = params.id;

  try {
    // Test database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      console.error("Database connection error:", error);
      return NextResponse.json(
        { message: "Database connection error. Please try again later." },
        { status: 503 }
      );
    }

    const teacherWithSubjects = await prisma.teacher.findUnique({
      where: {
        id: teacherId,
      },
      include: {
        subjects: {
          include: {
            subject: {
              include: {
                department: true,
                level: true,
              },
            },
          },
        },
      },
    });

    if (!teacherWithSubjects) {
      return NextResponse.json(
        { message: "Teacher not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(teacherWithSubjects.subjects);
  } catch (error) {
    console.error("Error fetching teacher subjects:", error);
    return NextResponse.json(
      { message: "Failed to fetch teacher subjects" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Only admin can manage subject assignments
  if (!["super_admin", "school_admin"].includes(session.role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const teacherId = params.id;

  try {
    // Test database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      console.error("Database connection error:", error);
      return NextResponse.json(
        { message: "Database connection error. Please try again later." },
        { status: 503 }
      );
    }

    const teacher = await prisma.teacher.findUnique({
      where: {
        id: teacherId,
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { message: "Teacher not found" },
        { status: 404 }
      );
    }

    const data = await request.json();
    const { subjectIds } = data;

    if (!Array.isArray(subjectIds)) {
      return NextResponse.json(
        { message: "Subject IDs must be an array" },
        { status: 400 }
      );
    }

    // Validate that all subject IDs exist
    if (subjectIds.length > 0) {
      const existingSubjects = await prisma.subject.findMany({
        where: {
          id: {
            in: subjectIds,
          },
        },
        select: {
          id: true,
        },
      });

      const existingSubjectIds = existingSubjects.map((s) => s.id);
      const invalidSubjectIds = subjectIds.filter(
        (id) => !existingSubjectIds.includes(id)
      );

      if (invalidSubjectIds.length > 0) {
        return NextResponse.json(
          {
            message: `The following subject IDs do not exist: ${invalidSubjectIds.join(
              ", "
            )}`,
          },
          { status: 400 }
        );
      }
    }

    // Update teacher subject assignments using a transaction
    const result = await prisma.$transaction(async (tx) => {
      // First, delete all existing assignments
      await tx.subjectTeacher.deleteMany({
        where: {
          teacherId,
        },
      });

      // Then, create new assignments
      if (subjectIds.length > 0) {
        await tx.subjectTeacher.createMany({
          data: subjectIds.map((subjectId) => ({
            teacherId,
            subjectId,
          })),
        });
      }

      return { count: subjectIds.length };
    });

    return NextResponse.json({
      message: "Subject assignments updated successfully",
      assignedSubjects: result.count,
    });
  } catch (error) {
    console.error("Error updating teacher subjects:", error);
    return NextResponse.json(
      { message: "Failed to update teacher subjects" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to update teacher subjects
    if (!["super_admin", "school_admin"].includes(session.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const teacherId = params.id;

    // Test database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      console.error("Database connection error:", error);
      return NextResponse.json(
        { message: "Database connection error. Please try again later." },
        { status: 503 }
      );
    }

    const teacher = await prisma.teacher.findUnique({
      where: {
        id: teacherId,
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { message: "Teacher not found" },
        { status: 404 }
      );
    }

    const data = await request.json();
    const { subjectIds } = data;

    if (!Array.isArray(subjectIds)) {
      return NextResponse.json(
        { message: "Subject IDs must be an array" },
        { status: 400 }
      );
    }

    // Validate that all subject IDs exist
    if (subjectIds.length > 0) {
      const existingSubjects = await prisma.subject.findMany({
        where: {
          id: {
            in: subjectIds,
          },
        },
        select: {
          id: true,
        },
      });

      const existingSubjectIds = existingSubjects.map((s) => s.id);
      const invalidSubjectIds = subjectIds.filter(
        (id) => !existingSubjectIds.includes(id)
      );

      if (invalidSubjectIds.length > 0) {
        return NextResponse.json(
          {
            message: `The following subject IDs do not exist: ${invalidSubjectIds.join(
              ", "
            )}`,
          },
          { status: 400 }
        );
      }
    }

    // Update teacher subject assignments using a transaction
    const result = await prisma.$transaction(async (tx) => {
      // First, delete all existing assignments
      await tx.subjectTeacher.deleteMany({
        where: {
          teacherId,
        },
      });

      // Then, create new assignments
      if (subjectIds.length > 0) {
        await tx.subjectTeacher.createMany({
          data: subjectIds.map((subjectId) => ({
            teacherId,
            subjectId,
          })),
        });
      }

      return { count: subjectIds.length };
    });

    return NextResponse.json({
      message: "Subject assignments updated successfully",
      assignedSubjects: result.count,
    });
  } catch (error) {
    console.error("Error updating teacher subjects:", error);
    return NextResponse.json(
      { message: "Failed to update teacher subjects" },
      { status: 500 }
    );
  }
}
