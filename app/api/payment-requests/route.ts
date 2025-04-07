import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { UserRole } from "@prisma/client";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Request validation schema
const paymentRequestSchema = z.object({
  studentId: z.string().min(1),
  billId: z.string().min(1),
  billAssignmentId: z.string().min(1),
  amount: z.number().positive(),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/payment-requests - Get payment requests
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession(null);
    if (!session || !session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const status = searchParams.get("status");

    // Check role and build query
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        role: true,
        schoolId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isAdmin =
      user.role === UserRole.SUPER_ADMIN ||
      user.role === UserRole.SCHOOL_ADMIN ||
      user.role === UserRole.TEACHER;
    const isParent = user.role === UserRole.PARENT;

    // Determine which payment requests to fetch based on role
    const whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    if (isParent && !isAdmin) {
      // Parents can only see their own children's payment requests
      const parentStudents = await prisma.studentParent.findMany({
        where: {
          parentId: session.id,
        },
        select: {
          studentId: true,
        },
      });

      const studentIds = parentStudents.map(
        (ps: { studentId: string }) => ps.studentId
      );

      if (studentId) {
        if (!studentIds.includes(studentId)) {
          return NextResponse.json(
            {
              error:
                "You are not authorized to view payment requests for this student",
            },
            { status: 403 }
          );
        }
        whereClause.studentId = studentId;
      } else {
        whereClause.studentId = {
          in: studentIds,
        };
      }
    } else if (studentId) {
      // Admin/Teacher can filter by any student
      whereClause.studentId = studentId;
    }

    // Fetch payment requests
    const paymentRequests = await prisma.paymentRequest.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
            classes: {
              include: {
                class: true,
              },
            },
          },
        },
        billAssignment: {
          include: {
            bill: {
              include: {
                account: true,
              },
            },
          },
        },
        processedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(paymentRequests);
  } catch (error) {
    console.error("Fetch payment requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment requests" },
      { status: 500 }
    );
  }
}

// POST /api/payment-requests - Submit a new payment request
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession(null);
    if (!session || !session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a parent
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        role: true,
        parent: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user || user.role !== UserRole.PARENT || !user.parent) {
      return NextResponse.json(
        { error: "Only parents can submit payment requests" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = paymentRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { studentId, billId, billAssignmentId, amount, receiptUrl, notes } =
      validationResult.data;

    // Verify that the requesting user is a parent of the student
    const parentStudent = await prisma.studentParent.findFirst({
      where: {
        parentId: user.parent.id, // Use parent profile ID instead of user ID
        studentId: studentId,
      },
    });

    console.log("Parent-Student relationship check:", {
      parentId: user.parent.id,
      studentId,
      found: !!parentStudent,
    });

    if (!parentStudent) {
      return NextResponse.json(
        { error: "You are not authorized to make payments for this student" },
        { status: 403 }
      );
    }

    // Verify bill assignment exists and belongs to the student
    const billAssignment = await prisma.billAssignment.findUnique({
      where: {
        id: billAssignmentId,
      },
      include: {
        bill: true,
        studentPayments: true,
      },
    });

    if (!billAssignment) {
      return NextResponse.json(
        { error: "Bill assignment not found" },
        { status: 404 }
      );
    }

    if (billAssignment.bill.id !== billId) {
      return NextResponse.json(
        { error: "Bill assignment does not match the provided bill" },
        { status: 400 }
      );
    }

    // Verify that there is remaining balance to pay
    const totalPaid = billAssignment.studentPayments.reduce(
      (sum: number, payment: any) => sum + payment.amountPaid,
      0
    );

    const remainingAmount = Math.max(0, billAssignment.bill.amount - totalPaid);

    if (amount > remainingAmount) {
      return NextResponse.json(
        { error: "Payment amount exceeds the remaining balance" },
        { status: 400 }
      );
    }

    // Create payment request
    const paymentRequest = await prisma.paymentRequest.create({
      data: {
        status: "PENDING",
        amount,
        receiptUrl: receiptUrl || null,
        notes: notes || null,
        billAssignment: {
          connect: {
            id: billAssignmentId,
          },
        },
        student: {
          connect: {
            id: studentId,
          },
        },
        bill: {
          connect: {
            id: billId,
          },
        },
      },
    });

    return NextResponse.json(
      {
        id: paymentRequest.id,
        message: "Payment request submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Payment request error:", error);
    return NextResponse.json(
      { error: "Failed to process payment request" },
      { status: 500 }
    );
  }
}
