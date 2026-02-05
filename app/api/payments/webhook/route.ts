import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SquadPaymentStatus } from "@prisma/client";
import { billingService } from "@/lib/billing-service";
import { sendPaymentNotificationEmail } from "@/lib/email";
import { payvesselClient } from "@/lib/payvessel";

/**
 * POST /api/payments/webhook
 * Handles Payvessel payment notifications
 */
export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("http_payvessel_http_signature");
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0] : "0.0.0.0";

    if (!signature) {
      console.error("No Payvessel signature provided");
      return NextResponse.json({ error: "No signature provided" }, { status: 400 });
    }

    const bodyText = await req.text();
    
    // 1. Verify Signature
    if (!payvesselClient.verifySignature(bodyText, signature)) {
      console.error("Invalid Payvessel signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 2. Verify IP (Optional but recommended)
    // if (!payvesselClient.isTrustedIp(ip)) {
    //   console.warn(`Webhook received from untrusted IP: ${ip}`);
    //   // return NextResponse.json({ error: "Untrusted source" }, { status: 403 });
    // }

    const payload = JSON.parse(bodyText);
    const { transaction, order } = payload;

    if (!transaction || !order) {
        return NextResponse.json({ error: "Invalid payload structure" }, { status: 400 });
    }

    // Payvessel reference is usually transaction.reference
    // For VAs it might be trackingReference, but webhook uses reference
    const reference = transaction.reference;
    const amount = Number(order.amount);

    // Check if this is a Usage Payment (EduIT Fee)
    const usagePayment = await prisma.payvesselUsage.findUnique({
      where: { reference: reference }
    });

    if (usagePayment) {
        if (usagePayment.status === "SUCCESS") {
            return NextResponse.json({ status: "already processed" });
        }

        await billingService.recordUsagePayment(
          usagePayment.schoolId,
          usagePayment.studentCount,
          amount,
          reference
        );

        await prisma.payvesselUsage.update({
            where: { id: usagePayment.id },
            data: { status: "SUCCESS", paidAt: new Date() }
        });

        return NextResponse.json({ status: "success" });
    }

    // Check if this is a School Fee Payment
    const feePayment = await prisma.payvesselPayment.findUnique({
      where: { reference: reference },
      include: {
          school: true,
          student: { include: { user: true, parents: { include: { parent: { include: { user: true } } } } } }
      }
    });

    if (feePayment) {
        if (feePayment.status === "SUCCESS") {
            return NextResponse.json({ status: "already processed" });
        }

        const { schoolId, studentId, feeId, metadata } = feePayment;
        const { billAssignmentId } = ((metadata as any) || {});

        const platformFee = amount * 0.02; // 2% platform fee
        const netAmount = amount - platformFee;

        await prisma.$transaction(async (tx) => {
          // Update Payvessel payment record
          await tx.payvesselPayment.update({
            where: { id: feePayment.id },
            data: {
              status: SquadPaymentStatus.SUCCESS,
              paidAt: new Date(),
              platformFee,
              netAmount
            },
          });

          // Update School Wallet balance
          await tx.schoolWallet.upsert({
            where: { schoolId },
            update: { balance: { increment: netAmount } },
            create: { schoolId, balance: netAmount },
          });

          // If this is an automated bill payment, record it
          if (billAssignmentId) {
            await tx.studentPayment.create({
              data: {
                studentId,
                billAssignmentId,
                amountPaid: amount,
              }
            });

            const assignment = await tx.billAssignment.findUnique({
              where: { id: billAssignmentId },
              include: { 
                bill: { select: { amount: true } },
                studentPayments: { select: { amountPaid: true } }
              }
            });

            if (assignment) {
              const currentPaid = assignment.studentPayments.reduce((s, p) => s + p.amountPaid, 0);
              const isFullyPaid = currentPaid >= assignment.bill.amount;
              
              await tx.billAssignment.update({
                where: { id: billAssignmentId },
                data: {
                  status: isFullyPaid ? "PAID" : "PARTIALLY_PAID"
                }
              });
            }
          }
        });

        // Send Notifications
        try {
            let billName = "School Fee";
            if (feeId) {
              const bill = await prisma.bill.findUnique({
                where: { id: feeId },
                select: { name: true }
              });
              if (bill) billName = bill.name;
            }

            const studentName = feePayment.student.user.name;
            const schoolName = feePayment.school.name;
            const schoolLogo = feePayment.school.logo;

            // 1. Notify Parent(s)
            for (const studentParent of feePayment.student.parents) {
              const parentUser = studentParent.parent.user;
              await sendPaymentNotificationEmail({
                to: parentUser.email,
                recipientName: parentUser.name,
                studentName,
                amount,
                billName,
                transactionRef: reference,
                date: new Date(),
                schoolName,
                schoolLogo: schoolLogo || undefined,
                isParent: true
              });
            }

            // 2. Notify School
            await sendPaymentNotificationEmail({
              to: feePayment.school.email,
              recipientName: "Administrator",
              studentName,
              amount,
              billName,
              transactionRef: reference,
              date: new Date(),
              schoolName,
              schoolLogo: schoolLogo || undefined,
              isParent: false
            });
        } catch (notifyError) {
          console.error("Failed to send payment notifications:", notifyError);
        }

        return NextResponse.json({ status: "success" });
    }

    console.warn(`Payment reference ${reference} not found in database`);
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  } catch (error: any) {
    console.error("Payvessel Webhook Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
