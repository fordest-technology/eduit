import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ExtendedResult } from "./types";
import type { UserRole } from "@/lib/auth";

export interface ResultsData {
  results: ExtendedResult[];
  userRole: UserRole;
  schoolId: string | undefined;
}

export async function getResultsAction(): Promise<ResultsData> {
  const cookieStore = cookies();
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

  return { results, userRole, schoolId };
}
