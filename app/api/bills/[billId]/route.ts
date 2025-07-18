import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
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

    // 2. Fetch bill with related data
    const bill = await prisma.bill.findUnique({
      where: {
        id: params.billId,
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

    return NextResponse.json(bill);
  } catch (error) {
    console.error("Error fetching bill details:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch bill details",
        ...(process.env.NODE_ENV === "development" && {
          stack: error instanceof Error ? error.stack : undefined,
          details: error,
        }),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    if (!user?.admin || !user.schoolId) {
      return NextResponse.json(
        { error: "Only school admins can delete bills" },
        { status: 403 }
      );
    }

    // 2. Verify bill exists and belongs to user's school
    const bill = await prisma.bill.findUnique({
      where: {
        id: params.billId,
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
        where: { billId: params.billId },
      }),
      // Delete the bill
      prisma.bill.delete({
        where: { id: params.billId },
      }),
    ]);

    return NextResponse.json({ message: "Bill deleted successfully" });
  } catch (error) {
    console.error("Error deleting bill:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete bill",
        ...(process.env.NODE_ENV === "development" && {
          stack: error instanceof Error ? error.stack : undefined,
          details: error,
        }),
      },
      { status: 500 }
    );
  }
}
