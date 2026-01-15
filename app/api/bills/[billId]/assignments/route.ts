import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma, withErrorHandling } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ billId: string }> }
) {
  return withErrorHandling(async () => {
    const { billId } = await params;
    
    // 1. Authentication & Authorization
    const auth = await requireAuth(req, ["SUPER_ADMIN", "SCHOOL_ADMIN"]);
    if (!auth.authenticated || !auth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user } = auth;

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
        id: billId,
        schoolId: user.schoolId as string,
      },
      include: {
        assignments: true,
      }
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // 4. Strict Idempotency Check
    // Prevent duplicate assignment of the same type to the same target
    const existingAssignment = bill.assignments.find(
        a => a.targetType === targetType && a.targetId === targetId
    );

    if (existingAssignment) {
        return NextResponse.json(
            { error: `This bill is already assigned to this ${targetType === "CLASS" ? "class" : "student"}` },
            { status: 400 }
        );
    }

    // 5. Verify target exists and belongs to the same school
    if (targetType === "CLASS") {
      const classExists = await prisma.class.findUnique({
        where: {
          id: targetId,
          schoolId: user.schoolId as string,
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
      
      // Also check if student is already covered by a CLASS assignment for this bill
      const studentClasses = await prisma.studentClass.findMany({
          where: { studentId: targetId, status: "ACTIVE" },
          select: { classId: true }
      });
      const classIds = studentClasses.map(sc => sc.classId);
      const isCoveredByClassAssignment = bill.assignments.some(
          a => a.targetType === "CLASS" && classIds.includes(a.targetId)
      );

      if (isCoveredByClassAssignment) {
          return NextResponse.json(
              { error: "This student is already covered by a class assignment for this bill" },
              { status: 400 }
          );
      }
    } else {
      return NextResponse.json(
        { error: "Invalid target type" },
        { status: 400 }
      );
    }

    // 6. Create bill assignment
    const assignment = await prisma.billAssignment.create({
      data: {
        billId: billId,
        targetType,
        targetId,
        dueDate: new Date(dueDate),
        status: "PENDING",
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  });
}
