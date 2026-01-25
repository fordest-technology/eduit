import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const { schoolId } = await params;
  const session = await getSession();

  if (!session || session.role !== "TEACHER") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Ensure user belongs to this school
  if (session.schoolId !== schoolId) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const teacher = await prisma.teacher.findFirst({
      where: {
        userId: session.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        },
        subjects: {
          include: {
            subject: true
          }
        },
        classes: {
            include: {
                level: true
            }
        }
      }
    });

    if (!teacher) {
      return new NextResponse("Teacher profile not found", { status: 404 });
    }

    return NextResponse.json(teacher);
  } catch (error) {
    console.error("[TEACHER_ME]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
