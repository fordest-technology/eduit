import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { SquadPaymentStatus } from "@prisma/client";
import { billingService } from "@/lib/billing-service";
import { sendPaymentNotificationEmail } from "@/lib/email";

const SQUAD_SECRET_KEY = process.env.SQUAD_SECRET_KEY || "";

/**
 * Verifies the Squad webhook signature
 */
function verifySignature(payload: string, signature: string) {
  const hash = crypto
    .createHmac("sha512", SQUAD_SECRET_KEY)
    .update(payload)
    .digest("hex")
    .toUpperCase();
  
  return hash === signature.toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-squad-signature");
    if (!signature) {
      return NextResponse.json({ error: "No signature provided" }, { status: 400 });
    }

    const bodyText = await req.text();
    if (!verifySignature(bodyText, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(bodyText);
    const { event, data } = payload;

    if (event === "transaction_successful") {
      const { transaction_ref, amount, metadata } = data;
      
      // Determine if this is a Parent Fee or a School Usage Payment
      const isUsagePayment = metadata?.type === "USAGE_BILLING";
      
      if (isUsagePayment) {
        // School paying EduIT
        const schoolId = metadata.schoolId;
        const studentCount = metadata.studentCount;
        
        await billingService.recordUsagePayment(
          schoolId,
          studentCount,
          amount / 100, // Squad sends amount in kobo
          transaction_ref
        );
      } else {
        // Parent paying School Fee
        const { schoolId, studentId, feeId, billAssignmentId } = metadata || {};
        
        if (!schoolId || !studentId) {
          console.error("Missing metadata in Squad webhook:", metadata);
          return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
        }

        const amountInNaira = amount / 100;
        const platformFee = amountInNaira * 0.02; // 2% platform fee
        const netAmount = amountInNaira - platformFee;

        await prisma.$transaction(async (tx) => {
          // Record the Squad payment
          await tx.squadPayment.create({
            data: {
              schoolId,
              studentId,
              feeId,
              squadReference: transaction_ref,
              amount: amountInNaira,
              platformFee,
              netAmount,
              status: SquadPaymentStatus.SUCCESS,
              paidAt: new Date(),
              metadata: metadata
            },
          });

          // Update School Wallet
          await tx.schoolWallet.upsert({
            where: { schoolId },
            update: { balance: { increment: netAmount } },
            create: { schoolId, balance: netAmount },
          });

          // If this is an automated bill payment
          if (billAssignmentId) {
            // 1. Create StudentPayment record
            await tx.studentPayment.create({
              data: {
                studentId,
                billAssignmentId,
                amountPaid: amountInNaira,
              }
            });

            // 2. Update BillAssignment status
            // Calculate total paid across all payments for this assignment
            const assignment = await tx.billAssignment.findUnique({
              where: { id: billAssignmentId },
              include: { 
                bill: { select: { amount: true } },
                studentPayments: { select: { amountPaid: true } }
              }
            });

            if (assignment) {
              const currentPaid = assignment.studentPayments.reduce((s, p) => s + p.amountPaid, 0) + amountInNaira;
              const isFullyPaid = currentPaid >= assignment.bill.amount;
              
              await tx.billAssignment.update({
                where: { id: billAssignmentId },
                data: {
                  status: isFullyPaid ? "PAID" : "PARTIALLY_PAID"
                }
              });
            }
          }

          // If there's a specific bill/fee, mark it as paid for backward compatibility
            });
          }
        });

        // Send Notifications (Outisde transaction to not block DB)
        try {
          // Fetch all necessary details
          const paymentData = await prisma.squadPayment.findUnique({
            where: { squadReference: transaction_ref },
            include: {
              student: {
                include: {
                  user: true,
                  parents: {
                    include: {
                      parent: {
                        include: {
                          user: true
                        }
                      }
                    }
                  }
                }
              },
              school: true
            }
          });

          if (paymentData) {
            let billName = "School Fee";
            if (feeId) {
              const bill = await prisma.bill.findUnique({
                where: { id: feeId },
                select: { name: true }
              });
              if (bill) billName = bill.name;
            }

            const studentName = paymentData.student.user.name;
            const schoolName = paymentData.school.name;
            const schoolLogo = paymentData.school.logo;
            const amount = Number(paymentData.amount);

            // 1. Notify Parent(s)
            for (const studentParent of paymentData.student.parents) {
              const parentUser = studentParent.parent.user;
              await sendPaymentNotificationEmail({
                to: parentUser.email,
                recipientName: parentUser.name,
                studentName,
                amount,
                billName,
                transactionRef: transaction_ref,
                date: new Date(),
                schoolName,
                schoolLogo: schoolLogo || undefined,
                isParent: true
              });
            }

            // 2. Notify School
            await sendPaymentNotificationEmail({
              to: paymentData.school.email,
              recipientName: "Administrator",
              studentName,
              amount,
              billName,
              transactionRef: transaction_ref,
              date: new Date(),
              schoolName,
              schoolLogo: schoolLogo || undefined,
              isParent: false
            });
          }
        } catch (notifyError) {
          console.error("Failed to send payment notifications:", notifyError);
        }
      }
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Squad Webhook Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
