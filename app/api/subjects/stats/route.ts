import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth-server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    const token = sessionCookie?.value;
    
    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await verifyJwt(token);
    
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!user.schoolId) {
      return new NextResponse("School not found", { status: 404 });
    }

    const [subjects, classes, teachers] = await Promise.all([
      prisma.subject.count({
        where: {
          schoolId: user.schoolId,
        },
      }),
      prisma.classSubject.count({
        where: {
          subject: {
            schoolId: user.schoolId,
          },
        },
      }),
      prisma.subjectTeacher.count({
        where: {
          subject: {
            schoolId: user.schoolId,
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
