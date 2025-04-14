import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { billId: string } }
) {
  try {
    // 1. Authentication & Authorization
    const session = await getSession(null);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { admin: true },
    });

    if (!user?.schoolId) {
      return NextResponse.json(
        { error: "User not associated with a school" },
        { status: 403 }
      );
    }

    // 2. Validate request body
    const body = await req.json();
    const { targetType, targetId, dueDate } = body;

    if (!targetType || !targetId || !dueDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 3. Verify bill exists and belongs to user's school
    const bill = await prisma.bill.findUnique({
      where: {
        id: params.billId,
        schoolId: user.schoolId,
      },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // 4. Verify target exists (class or student)
    if (targetType === "CLASS") {
      const classExists = await prisma.class.findUnique({
        where: {
          id: targetId,
          schoolId: user.schoolId,
        },
      });
      if (!classExists) {
        return NextResponse.json({ error: "Class not found" }, { status: 404 });
      }
    } else if (targetType === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { id: targetId },
        include: { user: true },
      });
      if (!student || student.user.schoolId !== user.schoolId) {
        return NextResponse.json(
          { error: "Student not found" },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Invalid target type" },
        { status: 400 }
      );
    }

    // 5. Create bill assignment
    const assignment = await prisma.billAssignment.create({
      data: {
        billId: params.billId,
        targetType,
        targetId,
        dueDate: new Date(dueDate),
      },
      include: {
        studentPayments: true,
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("Error creating bill assignment:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create bill assignment",
        ...(process.env.NODE_ENV === "development" && {
          stack: error instanceof Error ? error.stack : undefined,
          details: error,
        }),
      },
      { status: 500 }
    );
  }
}
