import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma, withErrorHandling } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { billId: string; assignmentId: string } }
) {
  return withErrorHandling(async () => {
    // Get authenticated user
    const auth = await requireAuth(req);
    if (!auth.authenticated || !auth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the assignment basics
    const assignment = await prisma.billAssignment.findUnique({
      where: {
        id: params.assignmentId,
        billId: params.billId,
      },
      include: {
        bill: {
          include: {
            items: true,
            account: true,
          },
        },
        studentPayments: {
          include: {
            student: {
              include: {
                user: {
                  select: { name: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Check school ID
    if (auth.user.schoolId !== assignment.bill.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If it's a class assignment, manually fetch class and its students
    let classData = null;
    if (assignment.targetType === "CLASS") {
      classData = await prisma.class.findUnique({
        where: { id: assignment.targetId },
        include: {
          students: {
            where: { status: "ACTIVE" },
            include: {
              student: {
                include: {
                  user: { select: { name: true, email: true } }
                }
              }
            }
          }
        }
      });

      // Flatten the student structure for the frontend
      if (classData) {
        (classData as any).students = classData.students.map(sc => ({
          id: sc.student.id,
          name: sc.student.user.name,
          user: sc.student.user
        }));
      }
    } else if (assignment.targetType === "STUDENT") {
        // Find single student details if it's an individual assignment
        const student = await prisma.student.findUnique({
            where: { id: assignment.targetId },
            include: { user: { select: { name: true } } }
        });
        (assignment as any).student = student;
    }

    return NextResponse.json({
        ...assignment,
        class: classData
    });
  });
}
