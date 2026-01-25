import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import * as z from "zod";

const createSubjectSchema = z.object({
  name: z.string().min(2),
  code: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  levelId: z.string().nullable().optional(),
  classIds: z.array(z.string()).optional(),
  autoAssignClasses: z.boolean().optional().default(true),
  autoAssignStudents: z.boolean().optional().default(true),
});

export async function GET(req: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Determine effective schoolId:
    // 1. If Super Admin, use query param (or session schoolId as fallback)
    // 2. If School Admin/Teacher, MUST use session schoolId
    const url = new URL(req.url);
    const reqSchoolId = url.searchParams.get("schoolId");
    
    const schoolId = session.role === "SUPER_ADMIN" 
      ? (reqSchoolId || session.schoolId)
      : session.schoolId;

    if (!schoolId) {
      return new NextResponse("School not found", { status: 404 });
    }

    const classId = url.searchParams.get("classId");

    // Build where clause
    const whereClause: any = {
      schoolId: schoolId,
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
            students: true,
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
    const schoolId = session.schoolId!;

    // 1. Identify classes to assign
    let classesToAssign: { id: string }[] = [];
    
    // Manual selection
    if (body.classIds && body.classIds.length > 0) {
        classesToAssign = body.classIds.map(id => ({ id }));
    }

    // Auto-assign based on Level (and Department logic? Typically subjects are class-wide or level-wide)
    // If auto-assign is on and we have a level...
    if (body.autoAssignClasses && body.levelId) {
        const levelClasses = await prisma.class.findMany({
            where: {
                schoolId,
                levelId: body.levelId
            },
            select: { id: true }
        });
        
        // Merge manual and auto-found classes, removing duplicates
        const existingIds = new Set(classesToAssign.map(c => c.id));
        levelClasses.forEach(c => {
            if (!existingIds.has(c.id)) {
                classesToAssign.push(c);
                existingIds.add(c.id);
            }
        });
    }

    // 2. Identify students to enroll
    let studentsToEnroll: { id: string }[] = [];

    if (body.autoAssignStudents && body.levelId) {
        // Find students in this school, at this level
        // Optionally filter by department if subject has a department
        const studentWhereInput: any = {
            // Find students who have an active class enrollment in a class belonging to this level
             classes: {
                some: {
                    status: 'ACTIVE',
                    class: {
                        levelId: body.levelId
                    }
                }
            }
        };

        // If subject is department-specific, restrict to students in that department
        if (body.departmentId) {
            studentWhereInput.departmentId = body.departmentId;
        }

        const eligibleStudents = await prisma.student.findMany({
            where: studentWhereInput,
            select: { id: true }
        });

        studentsToEnroll = eligibleStudents.map(s => ({ id: s.id }));
    }

    // CREATE TRANSACTION
    const subject = await prisma.$transaction(async (tx) => {
        // Create the subject
        const newSubject = await tx.subject.create({
            data: {
                name: body.name,
                code: body.code || null,
                description: body.description || null,
                departmentId: body.departmentId || null,
                levelId: body.levelId || null,
                schoolId: schoolId,
            }
        });

        // Create ClassSubject links
        if (classesToAssign.length > 0) {
            await tx.classSubject.createMany({
                data: classesToAssign.map(c => ({
                    classId: c.id,
                    subjectId: newSubject.id,
                })),
                skipDuplicates: true
            });
        }

        // Create StudentSubject links
        if (studentsToEnroll.length > 0) {
           await tx.studentSubject.createMany({
               data: studentsToEnroll.map(s => ({
                   studentId: s.id,
                   subjectId: newSubject.id,
               })),
               skipDuplicates: true
           });
        }
        
        // Return the full subject with includes
        return await tx.subject.findUnique({
            where: { id: newSubject.id },
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
                                    }
                                }
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        classes: true,
                        teachers: true,
                    }
                }
            }
        });
    });

    // Transform the data to match the frontend structure
    const transformedSubject = {
      ...subject,
      teachers: subject?.teachers.map((t) => ({
        teacher: {
          id: t.teacher.id,
          name: t.teacher.user.name,
          profileImage: t.teacher.user.profileImage,
          userId: t.teacher.user.id,
        },
      })) || [],
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
