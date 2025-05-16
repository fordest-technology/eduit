import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { billId: string; assignmentId: string } }
) {
  try {
    // Get authenticated user
    const session = await getSession(null);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the assignment with related data
    const assignment = await prisma.billAssignment.findUnique({
      where: {
        id: params.assignmentId,
        billId: params.billId,
      },
      include: {
        bill: {
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
          },
        },
        studentPayments: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
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

    // Check if user has access to this assignment
    if (session.schoolId !== assignment.bill.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("[BILLS_ASSIGNMENT_GET]", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Error",
        ...(process.env.NODE_ENV === "development" && {
          stack: error instanceof Error ? error.stack : undefined,
          details: error,
        }),
      },
      { status: 500 }
    );
  }
}
