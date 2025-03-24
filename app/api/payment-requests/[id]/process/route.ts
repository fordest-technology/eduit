import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";

// Request validation schema
const processRequestSchema = z.object({
  action: z.enum(["approve", "reject"]),
  notes: z.string().optional(),
});

// PUT /api/payment-requests/[id]/process - Process a payment request
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(null);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { admin: true },
    });

    if (!user || !user.admin || !user.schoolId) {
      return NextResponse.json(
        { error: "Only school admins can process payment requests" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { status, notes } = body;

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'APPROVED' or 'REJECTED'" },
        { status: 400 }
      );
    }

    // Find payment request
    const paymentRequest = await prisma.paymentRequest.findUnique({
      where: { id: params.id },
      include: {
        bill: true,
        billAssignment: true,
        student: true,
      },
    });

    if (!paymentRequest) {
      return NextResponse.json(
        { error: "Payment request not found" },
        { status: 404 }
      );
    }

    if (paymentRequest.bill.schoolId !== user.schoolId) {
      return NextResponse.json(
        { error: "You can only process payment requests for your school" },
        { status: 403 }
      );
    }

    if (paymentRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "This payment request has already been processed" },
        { status: 400 }
      );
    }

    // Update the payment request with the new status
    const updatedRequest = await prisma.paymentRequest.update({
      where: { id: params.id },
      data: {
        status: status as PaymentStatus,
        notes: notes,
        processedById: user.id,
        processedAt: new Date(),
      },
      include: {
        bill: true,
        billAssignment: true,
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    // If approved, create a student payment record
    if (status === "APPROVED") {
      // Create a student payment record
      const studentPayment = await prisma.studentPayment.create({
        data: {
          billAssignmentId: paymentRequest.billAssignmentId,
          studentId: paymentRequest.studentId,
          amountPaid: paymentRequest.amount,
        },
      });

      // Link the payment request to the student payment
      await prisma.paymentRequest.update({
        where: { id: params.id },
        data: {
          studentPaymentId: studentPayment.id,
        },
      });

      // Update the bill assignment status
      await updateBillAssignmentStatus(paymentRequest.billAssignmentId);
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Error processing payment request:", error);
    return NextResponse.json(
      { error: "Failed to process payment request" },
      { status: 500 }
    );
  }
}

// Helper function to update bill assignment status
async function updateBillAssignmentStatus(billAssignmentId: string) {
  // Get the bill assignment
  const billAssignment = await prisma.billAssignment.findUnique({
    where: { id: billAssignmentId },
    include: {
      bill: true,
      studentPayments: true,
    },
  });

  if (!billAssignment) return;

  // Calculate total paid amount
  const totalPaid = billAssignment.studentPayments.reduce(
    (sum, payment) => sum + payment.amountPaid,
    0
  );

  // Determine the new status based on paid amount
  let newStatus;
  if (totalPaid >= billAssignment.bill.amount) {
    newStatus = "PAID";
  } else if (totalPaid > 0) {
    newStatus = "PARTIALLY_PAID";
  } else {
    newStatus = "PENDING";
  }

  // Update the bill assignment status
  await prisma.billAssignment.update({
    where: { id: billAssignmentId },
    data: { status: newStatus },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await getSession(null);
    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin privileges
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.userRoles.some((ur) => ur.role.name === "ADMIN")) {
      return NextResponse.json(
        { error: "Insufficient permissions to process payment requests" },
        { status: 403 }
      );
    }

    // Get payment request ID from params
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: "Payment request ID is required" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = processRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { action, notes } = validationResult.data;

    // Find payment request
    const paymentRequest = await prisma.paymentRequest.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: true,
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
        requestedBy: true,
        reviewedBy: true,
      },
    });

    if (!paymentRequest) {
      return NextResponse.json(
        { error: "Payment request not found" },
        { status: 404 }
      );
    }

    // Check if the payment request is already processed
    if (paymentRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Payment request has already been processed" },
        { status: 400 }
      );
    }

    // Update status based on action
    const status = action === "approve" ? "APPROVED" : "REJECTED";

    // Process the payment request
    const updatedRequest = await prisma.paymentRequest.update({
      where: { id },
      data: {
        status,
        reviewNotes: notes || null,
        reviewedAt: new Date(),
        reviewedBy: {
          connect: {
            id: session.id,
          },
        },
      },
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
        requestedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // If approved, record the payment
    if (action === "approve") {
      await prisma.studentPayment.create({
        data: {
          amountPaid: paymentRequest.amount,
          receiptUrl: paymentRequest.receiptUrl,
          paymentDate: new Date(),
          notes: `Payment from request ID: ${paymentRequest.id}`,
          paymentRequest: {
            connect: {
              id: paymentRequest.id,
            },
          },
          student: {
            connect: {
              id: paymentRequest.student.id,
            },
          },
          billAssignment: {
            connect: {
              id: paymentRequest.billAssignment.id,
            },
          },
          bill: {
            connect: {
              id: paymentRequest.billAssignment.bill.id,
            },
          },
          recordedBy: {
            connect: {
              id: session.id,
            },
          },
        },
      });
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Error processing payment request:", error);
    return NextResponse.json(
      { error: "Failed to process payment request" },
      { status: 500 }
    );
  }
}
