import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma, withErrorHandling } from "@/lib/prisma";
import { z } from "zod";
import { logger } from "@/lib/logger";

// Define validation schema
const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  section: z.string().optional().nullable(),
  teacherId: z.string().optional().nullable(),
  levelId: z.string().optional().nullable(),
});

// GET all classes - Optimized for performance
export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    const auth = await requireAuth(req);

    if (!auth.authenticated || !auth.user) {
      logger.warn("Unauthorized access attempt to classes API");
      return NextResponse.json(
        { error: "You must be logged in to access this resource" },
        { status: 401 }
      );
    }

    const { user } = auth;
    if (!user.schoolId) {
      logger.warn("User without schoolId attempted to access classes", {
        userId: user.id,
      });
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    logger.info("Fetching classes", {
      schoolId: user.schoolId,
      userId: user.id,
    });

    // Get current academic session
    const currentSession = await withErrorHandling(async () => {
      return await prisma.academicSession.findFirst({
        where: {
          schoolId: user.schoolId,
          isCurrent: true,
        },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
        },
      });
    });

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const levelId = searchParams.get("levelId");

    return await withErrorHandling(async () => {
      // Optimized query with minimal includes and efficient counting
      const classes = await prisma.class.findMany({
        where: {
          schoolId: user.schoolId,
          ...(levelId ? { levelId } : {}),
        },
        select: {
          id: true,
          name: true,
          section: true,
          level: {
            select: {
              id: true,
              name: true,
            },
          },
          teacher: {
            select: {
              id: true,
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
              specialization: true,
            },
          },
          _count: {
            select: {
              students: {
                where: {
                  sessionId: currentSession?.id,
                  status: "ACTIVE",
                },
              },
              subjects: true,
            },
          },
        },
        orderBy: [
          {
            level: {
              order: "asc",
            },
          },
          {
            section: "asc",
          },
        ],
      });

      // Get subjects for all classes in a single query (if needed)
      const classIds = classes.map((c) => c.id);
      const classSubjects =
        classIds.length > 0
          ? await prisma.classSubject.findMany({
              where: {
                classId: { in: classIds },
              },
              select: {
                classId: true,
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
            })
          : [];

      // Group subjects by class
      const subjectsByClass = classSubjects.reduce((acc, cs) => {
        if (!acc[cs.classId]) {
          acc[cs.classId] = [];
        }
        acc[cs.classId].push({
          id: cs.classId + "-" + cs.subject.id, // Create a unique ID
          subject: cs.subject,
        });
        return acc;
      }, {} as Record<string, any[]>);

      // Format the response
      const formattedClasses = classes.map((classItem) => ({
        id: classItem.id,
        name: classItem.name,
        section: classItem.section,
        level: classItem.level,
        teacher: classItem.teacher,
        subjects: subjectsByClass[classItem.id] || [],
        _count: {
          students: classItem._count.students,
          subjects: classItem._count.subjects,
        },
        currentSession: currentSession,
      }));

      const duration = Date.now() - startTime;
      logger.api("GET /api/classes", duration, {
        schoolId: user.schoolId,
        count: formattedClasses.length,
        levelId: levelId || null,
      });

      return NextResponse.json(formattedClasses);
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Error in GET /api/classes", error, { duration });
    return NextResponse.json(
      { error: "Failed to load class data" },
      { status: 500 }
    );
  }
}

// POST to create a new class
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const auth = await requireAuth(req, ["SUPER_ADMIN", "SCHOOL_ADMIN"]);

    if (!auth.authenticated || !auth.authorized || !auth.user) {
      logger.warn("Unauthorized attempt to create class", {
        userId: auth.user?.id,
        role: auth.user?.role,
      });
      return NextResponse.json(
        { error: "You are not authorized to perform this action" },
        { status: 403 }
      );
    }

    const { user } = auth;
    const schoolId = user.schoolId;

    if (!schoolId) {
      logger.warn("User without schoolId attempted to create class", {
        userId: user.id,
      });
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await req.json();
    logger.info("Creating new class", { schoolId, body });

    // Validate input
    const validationResult = createClassSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn("Invalid class creation data", {
        errors: validationResult.error.errors,
        schoolId,
      });
      return NextResponse.json(
        {
          error: "Invalid input data",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { name, section, teacherId, levelId } = validationResult.data;

    // Check if class name already exists in the school
    const existingClass = await prisma.class.findFirst({
      where: {
        schoolId,
        name: name.trim(),
        ...(section ? { section: section.trim() } : { section: null }),
      },
    });

    if (existingClass) {
      logger.warn("Attempted to create duplicate class", {
        schoolId,
        name,
        section,
        existingClassId: existingClass.id,
      });
      return NextResponse.json(
        { error: "A class with this name and section already exists" },
        { status: 409 }
      );
    }

    // Create the class and auto-assign subjects in a transaction
    const createdClass = await prisma.$transaction(async (tx) => {
      // 1. Create the class
      const cls = await tx.class.create({
        data: {
          name: name.trim(),
          section: section?.trim() || null,
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
        },
      });

      // 2. If levelId provided, find and assign level-wide subjects
      if (levelId) {
        const levelSubjects = await tx.subject.findMany({
          where: { levelId, schoolId },
          select: { id: true }
        });

        if (levelSubjects.length > 0) {
          await tx.classSubject.createMany({
            data: levelSubjects.map(s => ({
              classId: cls.id,
              subjectId: s.id
            }))
          });
        }
      }

      return cls;
    });

    const duration = Date.now() - startTime;
    logger.api("POST /api/classes", duration, {
      schoolId,
      classId: createdClass.id,
      className: createdClass.name,
    });

    return NextResponse.json(createdClass, { status: 201 });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error("Error in POST /api/classes", error, { duration });

    return NextResponse.json(
      { error: "Failed to create class" },
      { status: 500 }
    );
  }
}
