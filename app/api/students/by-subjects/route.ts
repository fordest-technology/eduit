import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const subjectIds = searchParams.get("subjectIds")?.split(",") || [];

    if (!subjectIds.length) {
      return NextResponse.json([]);
    }

    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        schoolId: session.schoolId,
        studentClass: {
          some: {
            class: {
              subjects: {
                some: {
                  subjectId: {
                    in: subjectIds,
                  },
                },
              },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        studentClass: {
          select: {
            class: {
              select: {
                name: true,
                section: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Transform the data to include class information
    const formattedStudents = students.map((student) => ({
      id: student.id,
      name: student.name,
      class: student.studentClass[0]?.class.name,
      section: student.studentClass[0]?.class.section,
    }));

    return NextResponse.json(formattedStudents);
  } catch (error) {
    console.error("[STUDENTS_BY_SUBJECTS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
