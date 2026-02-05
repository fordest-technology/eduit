import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, withErrorHandling } from "@/lib/prisma";
import { payvesselClient } from "@/lib/payvessel";
import { UserRole } from "@prisma/client";

/**
 * POST /api/payments/create
 * Creates a Payvessel payment request for a parent or school
 * Uses Dynamic Virtual Accounts for "Pay with Transfer" flow
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
          select: { id: true, name: true, email: true, phone: true }
        });
      });

      if (!school) {
        return NextResponse.json({ error: "School not found" }, { status: 404 });
      }

      // Calculate how many students they are paying for
      const studentCount = amount / 2000;

      // Create Dynamic Virtual Account for the school to pay EduIT
      const payvesselResponse = await payvesselClient.createVirtualAccount({
        email: school.email,
        name: school.name,
        phoneNumber: school.phone || "08000000000",
        bankcode: ["999991", "120001"], // Palmpay and 9PSB
        account_type: "DYNAMIC"
      });

      if (!payvesselResponse.status) {
        throw new Error(payvesselResponse.message || "Failed to create virtual account");
      }

      const vaData = payvesselResponse.banks[0]; // Take the first bank offered

      // Log intent in DB
      await prisma.payvesselUsage.create({
        data: {
          schoolId: school.id,
          amount: amount,
          studentCount: studentCount,
          reference: vaData.trackingReference,
          status: "PENDING"
        }
      });

      return NextResponse.json({ 
        status: "success",
        payment_method: "TRANSFER",
        account_details: {
          ...vaData,
          amount: amount,
          description: `EduIT Usage Billing - ${studentCount} students`
        }
      });
    } else {
      // Parent paying school fee
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
          select: { email: true, name: true, phone: true, parent: { select: { phone: true } } }
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

      if (!schoolId) {
        return NextResponse.json({ error: "School ID not found" }, { status: 404 });
      }

      // Create Dynamic Virtual Account for the parent to pay School
      const payvesselResponse = await payvesselClient.createVirtualAccount({
        email: user!.email,
        name: user?.name || "Parent",
        phoneNumber: user?.phone || "08000000000",
        bankcode: ["999991", "120001"],
        account_type: "DYNAMIC"
      });

      if (!payvesselResponse.status) {
        throw new Error(payvesselResponse.message || "Failed to create virtual account");
      }

      const vaData = payvesselResponse.banks[0];

      // Log intent in DB
      await prisma.payvesselPayment.create({
        data: {
          schoolId,
          studentId,
          feeId: billId,
          reference: vaData.trackingReference,
          amount: amount,
          platformFee: amount * 0.02,
          netAmount: amount * 0.98,
          status: "PENDING",
          metadata: {
            billAssignmentId,
            description: description || "School Fee Payment"
          }
        }
      });

      return NextResponse.json({ 
        status: "success",
        payment_method: "TRANSFER",
        account_details: {
          ...vaData,
          amount: amount,
          description: description || "School Fee Payment"
        }
      });
    }
  } catch (error: any) {
    console.error("Create Payment Error:", error);
    const errorMessage = error.response?.data?.message || error.message || "Internal server error";
    const statusCode = error.response?.status || 500;
    
    return NextResponse.json(
      { error: errorMessage }, 
      { status: statusCode === 401 ? 401 : statusCode === 403 ? 403 : 500 }
    );
  }
}
