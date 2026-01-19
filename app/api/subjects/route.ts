import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import * as z from "zod";

const createSubjectSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).nullable().optional(),
  description: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  levelId: z.string().nullable().optional(),
  classIds: z.array(z.string()).optional(), // Added classIds support
  schoolId: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!session.schoolId) {
      return new NextResponse("School not found", { status: 404 });
    }

    // Get query parameters
    const url = new URL(req.url);
    const classId = url.searchParams.get("classId");

    // Build where clause
    const whereClause: any = {
      schoolId: session.schoolId,
    };

    // If classId is provided, filter subjects by class
    if (classId) {
      whereClause.classes = {
        some: {
          classId: classId,
        },
      };
    }

    const subjects = await prisma.subject.findMany({
      where: whereClause,
      include: {
        department: true,
        level: true,
        teachers: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    profileImage: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            classes: true,
            teachers: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Transform the data to match the frontend structure
    const transformedSubjects = subjects.map((subject) => ({
      ...subject,
      teachers: subject.teachers.map((t) => ({
        teacher: {
          id: t.teacher.id,
          name: t.teacher.user.name,
          profileImage: t.teacher.user.profileImage,
          userId: t.teacher.user.id,
        },
      })),
    }));

    return NextResponse.json(transformedSubjects);
  } catch (error) {
    console.error("[SUBJECTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.role !== "SUPER_ADMIN" && session.role !== "SCHOOL_ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await req.json();
    const body = createSubjectSchema.parse(json);

    // Auto-assign to all classes in the level if provided
    let finalClassIds = body.classIds || [];
    if (body.levelId) {
      const levelClasses = await prisma.class.findMany({
        where: { levelId: body.levelId, schoolId: session.schoolId! },
        select: { id: true }
      });
      const levelClassIds = levelClasses.map(c => c.id);
      finalClassIds = Array.from(new Set([...finalClassIds, ...levelClassIds]));
    }

    const subject = await prisma.subject.create({
      data: {
        name: body.name,
        code: body.code || null,
        description: body.description || null,
        departmentId: body.departmentId || null,
        levelId: body.levelId || null,
        schoolId: session.schoolId!,
        // Create class assignments
        classes: finalClassIds.length > 0 ? {
          create: finalClassIds.map((id) => ({
            classId: id
          }))
        } : undefined
      },
      include: {
        department: true,
        level: true,
        teachers: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    profileImage: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            classes: true,
            teachers: true,
          },
        },
      },
    });

    // Transform the data to match the frontend structure
    const transformedSubject = {
      ...subject,
      teachers: subject.teachers.map((t) => ({
        teacher: {
          id: t.teacher.id,
          name: t.teacher.user.name,
          profileImage: t.teacher.user.profileImage,
          userId: t.teacher.user.id,
        },
      })),
    };

    return NextResponse.json(transformedSubject);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 });
    }

    console.error("[SUBJECTS_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
