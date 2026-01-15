import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, withErrorHandling } from "@/lib/prisma";
import { squadClient } from "@/lib/squad";
import { UserRole } from "@prisma/client";

/**
 * POST /api/payments/create
 * Creates a Squad payment request for a parent or school
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, amount, studentId, billId, billAssignmentId, description } = body;

    if (type === "USAGE_BILLING") {
      // School paying EduIT for students
      if (session.role !== UserRole.SCHOOL_ADMIN && session.role !== UserRole.SUPER_ADMIN) {
        return NextResponse.json({ error: "Only admins can pay usage fees" }, { status: 403 });
      }

      const school = await withErrorHandling(async () => {
        return await prisma.school.findUnique({
          where: { id: session.schoolId! },
          select: { id: true, name: true, email: true }
        });
      });

      if (!school) {
        return NextResponse.json({ error: "School not found" }, { status: 404 });
      }

      // Calculate how many students they are paying for
      const studentCount = amount / 2000;

      const squadResponse = await squadClient.initiatePayment({
        amount: amount * 100, // Convert to kobo
        currency: "NGN",
        email: school.email,
        customer_name: school.name,
        initiate_type: "inline",
        metadata: {
          type: "USAGE_BILLING",
          schoolId: school.id,
          studentCount: studentCount,
          description: `EduIT Usage Billing - ${studentCount} students`
        }
      });

      // Log intent in DB
      if (squadResponse.data?.transaction_ref) {
          await prisma.usagePayment.create({
              data: {
                  schoolId: school.id,
                  amount: amount,
                  studentCount: studentCount,
                  squadReference: squadResponse.data.transaction_ref,
                  status: "PENDING"
              }
          });
      }

      return NextResponse.json({ ...squadResponse, status: 200 });
    } else {
      // Parent paying school fee
      // ... (validation code remains the same)
      if (!studentId) {
        return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
      }
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: "A valid payment amount is required" }, { status: 400 });
      }
      if (!billId) {
        return NextResponse.json({ error: "Bill ID is required" }, { status: 400 });
      }

      const user = await withErrorHandling(async () => {
        return await prisma.user.findUnique({
          where: { id: session.id },
          select: { email: true, name: true }
        });
      });

      let schoolId = session.schoolId;
      if (!schoolId) {
        const student = await withErrorHandling(async () => {
          return await prisma.student.findUnique({
            where: { id: studentId },
            select: { user: { select: { schoolId: true } } }
          });
        });
        schoolId = student?.user.schoolId || null;
      }

      const squadResponse = await squadClient.initiatePayment({
        amount: Math.round(amount * 100), 
        currency: "NGN",
        email: user!.email,
        customer_name: user?.name || "Parent",
        initiate_type: "inline",
        metadata: {
          type: "FEE_PAYMENT",
          schoolId: schoolId,
          studentId: studentId,
          description: description || "School Fee Payment",
          billAssignmentId: billAssignmentId || null,
          feeId: billId
        }
      });

      // Log intent in DB
      if (squadResponse.data?.transaction_ref && schoolId) {
          await prisma.squadPayment.create({
              data: {
                  schoolId,
                  studentId,
                  feeId: billId,
                  squadReference: squadResponse.data.transaction_ref,
                  amount: amount,
                  platformFee: amount * 0.02,
                  netAmount: amount * 0.98,
                  status: "PENDING",
                  metadata: {
                      billAssignmentId,
                      ...squadResponse.metadata // Keep a copy of what we sent to Squad
                  }
              }
          });
      }

      return NextResponse.json({ ...squadResponse, status: 200 });
    }
  } catch (error: any) {
    console.error("Create Payment Error:", error);
    // If it's a Squad API error, try to return their specific message
    const errorMessage = error.response?.data?.message || error.message || "Internal server error";
    const statusCode = error.response?.status || 500;
    
    return NextResponse.json(
      { error: errorMessage }, 
      { status: statusCode === 401 ? 401 : statusCode === 403 ? 403 : 500 }
    );
  }
}
