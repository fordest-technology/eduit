import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { ExtendedResult } from "./types";

export async function getResults() {
  const cookieStore = await cookies();
  const auth = await requireAuth(
    new NextRequest("http://localhost", {
      headers: new Headers({
        cookie: cookieStore.toString(),
      }),
    })
  );
  if (!auth.authenticated || !auth.authorized) {
    throw new Error("Unauthorized");
  }

  const userRole = auth.user.role;
  const userId = auth.user.id;
  const schoolId = auth.user.schoolId;

  let results: ExtendedResult[] = [];
  if (userRole === "school_admin" || userRole === "super_admin") {
    const dbResults = await prisma.result.findMany({
      where: {
        student: {
          user: {
            schoolId: schoolId,
          },
        },
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                schoolId: true,
                profileImage: true,
              },
            },
            classes: {
              include: {
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
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    results = dbResults.map((result) => ({
      ...result,
      position: null,
      section: result.student.classes[0]?.class.section || null,
    }));
  } else if (userRole === "teacher") {
    // Get results for classes where user is class teacher or subject teacher
    const teacherClasses = await prisma.class.findMany({
      where: {
        OR: [
          { teacherId: userId },
          {
            subjects: {
              some: {
                subject: {
                  teachers: {
                    some: {
                      teacherId: userId,
                    },
                  },
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    const dbResults = await prisma.result.findMany({
      where: {
        student: {
          classes: {
            some: {
              classId: {
                in: teacherClasses.map((c) => c.id),
              },
            },
          },
        },
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                schoolId: true,
                profileImage: true,
              },
            },
            classes: {
              include: {
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
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    results = dbResults.map((result) => ({
      ...result,
      position: null,
      section: result.student.classes[0]?.class.section || null,
    }));
  }

  return results;
}
