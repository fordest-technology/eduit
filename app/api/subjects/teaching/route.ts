import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "teacher") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const subjects = await prisma.subject.findMany({
      where: {
        teachers: {
          some: {
            teacherId: session.id,
          },
        },
        schoolId: session.schoolId,
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    return NextResponse.json(subjects);
  } catch (error) {
    console.error("[SUBJECTS_TEACHING]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
