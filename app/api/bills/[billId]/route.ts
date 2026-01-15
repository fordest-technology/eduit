import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, withErrorHandling } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ billId: string }> }
) {
  return withErrorHandling(async () => {
    const { billId } = await params;
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

    // 2. Fetch bill with related data
    const bill = await prisma.bill.findUnique({
      where: {
        id: billId,
        schoolId: user.schoolId,
      },
      include: {
        items: true,
        account: {
          select: {
            id: true,
            name: true,
            accountNo: true,
            bankName: true,
            branchCode: true,
            description: true,
            isActive: true,
          },
        },
        assignments: {
          include: {
            studentPayments: true,
          },
        },
      },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // 3. Manually fetch names for assignments to avoid Prisma include issues
    const targetIds = bill.assignments.map((a) => a.targetId);
    const studentIds = bill.assignments
      .filter((a) => a.targetType === "STUDENT")
      .map((a) => a.targetId);
    
    const classIds = bill.assignments
      .filter((a) => a.targetType === "CLASS")
      .map((a) => a.targetId);

    const [students, classes, legacyStudentClasses] = await Promise.all([
      prisma.student.findMany({
        where: { id: { in: studentIds } },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              profileImage: true,
            },
          },
        },
      }),
      prisma.class.findMany({
        where: { id: { in: classIds } },
        select: {
          id: true,
          name: true,
          section: true,
          students: {
            where: { status: "ACTIVE" }, // Only count active students
            select: { id: true }
          }
        },
      }),
      // Backward compatibility: some assignments might have used StudentClass.id
      prisma.studentClass.findMany({
        where: { id: { in: studentIds } },
        include: {
          student: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  profileImage: true,
                }
              }
            }
          }
        }
      })
    ]);

    // 4. Map the data back to assignments
    const assignmentsWithData = bill.assignments.map((assignment) => {
      if (assignment.targetType === "STUDENT") {
        let studentData = students.find((s) => s.id === assignment.targetId);
        
        // Try legacy studentClass lookup if direct student not found
        if (!studentData) {
          const lsc = legacyStudentClasses.find((sc) => sc.id === assignment.targetId);
          if (lsc) {
            studentData = lsc.student as any;
          }
        }

        return {
          ...assignment,
          student: studentData,
        };
      } else {
        return {
          ...assignment,
          class: classes.find((c) => c.id === assignment.targetId),
        };
      }
    });

    return NextResponse.json({
      ...bill,
      assignments: assignmentsWithData,
    });
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ billId: string }> }
) {
  return withErrorHandling(async () => {
    const { billId } = await params;
    // 1. Authentication & Authorization
    const session = await getSession(null);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { admin: true },
    });

    if (!user?.admin || !user.schoolId) {
      return NextResponse.json(
        { error: "Only school admins can delete bills" },
        { status: 403 }
      );
    }

    // 2. Verify bill exists and belongs to user's school
    const bill = await prisma.bill.findUnique({
      where: {
        id: billId,
        schoolId: user.schoolId,
      },
      include: {
        assignments: {
          include: {
            studentPayments: true,
          },
        },
      },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // 3. Check if bill has any payments
    const hasPayments = bill.assignments.some(
      (assignment) => assignment.studentPayments.length > 0
    );

    if (hasPayments) {
      return NextResponse.json(
        { error: "Cannot delete bill with existing payments" },
        { status: 400 }
      );
    }

    // 4. Delete bill and its assignments
    await prisma.$transaction([
      // Delete all bill assignments
      prisma.billAssignment.deleteMany({
        where: { billId: billId },
      }),
      // Delete the bill
      prisma.bill.delete({
        where: { id: billId },
      }),
    ]);

    return NextResponse.json({ message: "Bill deleted successfully" });
  });
}
