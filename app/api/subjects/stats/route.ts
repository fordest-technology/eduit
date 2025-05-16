import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!session.user?.schoolId) {
      return new NextResponse("School not found", { status: 404 });
    }

    const [subjects, classes, teachers] = await Promise.all([
      prisma.subject.count({
        where: {
          schoolId: session.user.schoolId,
        },
      }),
      prisma.classSubject.count({
        where: {
          subject: {
            schoolId: session.user.schoolId,
          },
        },
      }),
      prisma.subjectTeacher.count({
        where: {
          subject: {
            schoolId: session.user.schoolId,
          },
        },
      }),
    ]);

    return NextResponse.json({
      totalSubjects: subjects,
      totalClasses: classes,
      totalTeachers: teachers,
    });
  } catch (error) {
    console.error("[SUBJECTS_STATS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
