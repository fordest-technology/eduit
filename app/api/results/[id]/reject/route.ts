import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { role, schoolId } = session;
    if (role !== "SUPER_ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const result = await prisma.result.update({
      where: {
        id: params.id,
        schoolId,
      },
      data: {
        isApproved: false,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[RESULT_REJECT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
