import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/payments/receipt/[reference]
 * Returns data for a professional receipt
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { reference: string } }
) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reference } = params;

    const payment = await prisma.squadPayment.findUnique({
      where: { squadReference: reference },
      include: {
        student: {
          include: {
            user: true,
            classes: {
              include: {
                class: true
              },
              where: {
                status: "ACTIVE"
              },
              take: 1
            }
          }
        },
        school: true
      }
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Security check: only the parent, student, or school admin can see this receipt
    const isOwner = payment.studentId === session.id || payment.student.userId === session.id;
    const isSchoolAdmin = session.schoolId === payment.schoolId && session.role === "SCHOOL_ADMIN";
    
    // Check if user is a parent of this student
    let isParent = false;
    if (session.role === "PARENT") {
        const parentOfStudent = await prisma.studentParent.findFirst({
            where: {
                studentId: payment.studentId,
                parent: { userId: session.id }
            }
        });
        isParent = !!parentOfStudent;
    }

    if (!isOwner && !isSchoolAdmin && !isParent && session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized access to receipt" }, { status: 403 });
    }

    // Get bill name
    let billName = "School Fee";
    if (payment.feeId) {
      const bill = await prisma.bill.findUnique({
        where: { id: payment.feeId },
        select: { name: true }
      });
      if (bill) billName = bill.name;
    }

    return NextResponse.json({
      receiptNumber: payment.squadReference.slice(-8).toUpperCase(),
      transactionRef: payment.squadReference,
      date: payment.paidAt || payment.createdAt,
      amount: Number(payment.amount),
      status: payment.status,
      billName,
      student: {
        name: payment.student.user.name,
        class: payment.student.classes[0]?.class.name || "N/A"
      },
      school: {
        name: payment.school.name,
        logo: payment.school.logo,
        address: payment.school.address,
        phone: payment.school.phone,
        email: payment.school.email,
      },
      eduitLogo: "https://eduit.app/logo.png", // Replace with real EduIT logo URL
    });
  } catch (error) {
    console.error("Receipt API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
