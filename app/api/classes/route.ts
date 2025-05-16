import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Define validation schema
const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  section: z.string().optional().nullable(),
  teacherId: z.string().optional().nullable(),
  levelId: z.string().optional().nullable(),
});

// GET all classes
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);

    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { error: "You must be logged in to access this resource" },
        { status: 401 }
      );
    }

    const { user } = auth;
    if (!user.schoolId) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Get current academic session
    const currentSession = await prisma.academicSession.findFirst({
      where: {
        schoolId: user.schoolId,
        isCurrent: true,
      },
    });

    // Get all classes for the school
    const { searchParams } = new URL(req.url);
    const levelId = searchParams.get("levelId");

    const classes = await prisma.class.findMany({
      where: {
        schoolId: user.schoolId,
        ...(levelId ? { levelId } : {}),
      },
      include: {
        level: true,
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                profileImage: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        subjects: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                department: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        students: {
          where: {
            sessionId: currentSession?.id,
            status: "ACTIVE",
          },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                    profileImage: true,
                  },
                },
                department: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
            subjects: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Format the response
    const formattedClasses = classes.map((classItem) => ({
      id: classItem.id,
      name: classItem.name,
      section: classItem.section,
      level: classItem.level,
      teacher: classItem.teacher
        ? {
            id: classItem.teacher.id,
            user: {
              name: classItem.teacher.user.name,
              email: classItem.teacher.user.email,
              profileImage: classItem.teacher.user.profileImage,
            },
            department: classItem.teacher.department,
            specialization: classItem.teacher.specialization,
          }
        : null,
      subjects: classItem.subjects.map((s) => ({
        id: s.id,
        subject: s.subject,
      })),
      students: classItem.students.map((s) => ({
        id: s.id,
        student: {
          id: s.student.id,
          user: s.student.user,
          department: s.student.department,
        },
        rollNumber: s.rollNumber,
      })),
      _count: {
        students: classItem._count.students,
        subjects: classItem._count.subjects,
      },
      currentSession: currentSession
        ? {
            id: currentSession.id,
            name: currentSession.name,
            startDate: currentSession.startDate,
            endDate: currentSession.endDate,
          }
        : null,
    }));

    return NextResponse.json(formattedClasses);
  } catch (error) {
    console.error("[CLASSES_GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to load class data" },
      { status: 500 }
    );
  }
}

// POST to create a new class
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, ["SUPER_ADMIN", "SCHOOL_ADMIN"]);

    if (!auth.authenticated || !auth.authorized || !auth.user) {
      return NextResponse.json(
        { error: "You are not authorized to perform this action" },
        { status: 403 }
      );
    }

    const { user } = auth;
    const schoolId = user.schoolId;

    if (!schoolId) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await req.json();
    console.log("API received body:", body); // Debug log

    // Validate input
    const validationResult = createClassSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return NextResponse.json({ errors }, { status: 400 });
    }

    const { name, section, teacherId, levelId } = validationResult.data;

    // Verify teacher if provided
    if (teacherId) {
      console.log("Verifying teacher:", teacherId); // Debug log
      const teacher = await prisma.teacher.findUnique({
        where: { id: teacherId },
        include: { user: true },
      });

      if (!teacher) {
        return NextResponse.json(
          { error: "Teacher not found" },
          { status: 404 }
        );
      }

      if (teacher.user.schoolId !== schoolId) {
        return NextResponse.json(
          { error: "Teacher does not belong to the specified school" },
          { status: 400 }
        );
      }
    }

    // Verify level if provided
    if (levelId) {
      console.log("Verifying level:", levelId); // Debug log
      const level = await prisma.schoolLevel.findUnique({
        where: { id: levelId },
      });

      if (!level) {
        return NextResponse.json(
          { error: "School level not found" },
          { status: 404 }
        );
      }

      if (level.schoolId !== schoolId) {
        return NextResponse.json(
          { error: "School level does not belong to the specified school" },
          { status: 400 }
        );
      }
    }

    // Create the class
    const newClass = await prisma.class.create({
      data: {
        name,
        section: section || null,
        teacherId: teacherId || null,
        levelId: levelId || null,
        schoolId,
      },
      include: {
        level: true,
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                profileImage: true,
              },
            },
          },
        },
        subjects: true,
        students: {
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
          },
        },
      },
    });

    console.log("Created class:", newClass); // Debug log
    return NextResponse.json(newClass);
  } catch (error) {
    console.error("[CLASSES_POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create class" },
      { status: 500 }
    );
  }
}
