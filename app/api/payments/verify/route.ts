import { NextRequest, NextResponse } from "next/server";
import { prisma, withErrorHandling } from "@/lib/prisma";
import { squadClient } from "@/lib/squad";
import { SquadPaymentStatus } from "@prisma/client";
import { sendPaymentNotificationEmail } from "@/lib/email";

/**
 * GET /api/payments/verify
 * Verifies a transaction status manually with Squad and updates DB if needed.
 * This acts as a reliable fallback when webhooks are delayed or unreachable.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference") || searchParams.get("transaction_ref");

    if (!reference) {
      return NextResponse.json({ error: "No reference provided" }, { status: 400 });
    }

    // 1. Check if we already have this transaction marked as success
    const existingPayment = await prisma.squadPayment.findUnique({
      where: { squadReference: reference },
    });

    if (existingPayment?.status === SquadPaymentStatus.SUCCESS) {
      return NextResponse.json({ 
        status: "success", 
        message: "Payment already processed",
        data: existingPayment 
      });
    }

    // 2. Verify with Squad
    const squadVerify = await squadClient.verifyTransaction(reference);
    console.log("Squad Verify Response for", reference, ":", JSON.stringify(squadVerify, null, 2));
    
    const isSuccess = (squadVerify.status === 200 || squadVerify.success) && 
                     (squadVerify.data?.transaction_status === "success" || squadVerify.data?.status === "success");

    if (!isSuccess) {
      return NextResponse.json({ 
        status: "pending", 
        message: "Payment not yet successful",
        details: squadVerify.data?.transaction_status || "Pending"
      });
    }

    // 3. Process the successful payment
    const data = squadVerify.data;
    // Squad verification response uses transaction_amount
    const amount = data.transaction_amount || data.amount;
    
    // Squad sometimes uses 'meta', 'metadata', or even 'custom_metadata'
    let metadata: any = data.metadata || data.meta || data.custom_metadata || {};
    
    if (typeof metadata === "string") {
      try {
        metadata = JSON.parse(metadata);
        if (typeof metadata === "string") {
            metadata = JSON.parse(metadata);
        }
      } catch (e) {
        console.error("Failed to parse metadata string:", metadata);
      }
    }

    console.log("Resiliently Parsed Metadata:", metadata);
    
    let schoolId = metadata.schoolId || data.schoolId || data.school_id;
    let studentId = metadata.studentId || data.studentId || data.student_id;
    let type = metadata.type || data.type;
    let feeId = metadata.feeId || data.feeId || data.billId;
    let billAssignmentId = metadata.billAssignmentId || data.billAssignmentId;

    // --- FALLBACK ---
    if (!schoolId || !studentId) {
        const localIntent = await prisma.squadPayment.findUnique({
            where: { squadReference: reference }
        });
        
        if (localIntent) {
            schoolId = schoolId || localIntent.schoolId;
            studentId = studentId || localIntent.studentId;
            feeId = feeId || localIntent.feeId;
            type = type || "FEE_PAYMENT";
            const localMeta = typeof localIntent.metadata === 'string' ? JSON.parse(localIntent.metadata) : localIntent.metadata;
            billAssignmentId = billAssignmentId || localMeta?.billAssignmentId;
        }
    }

    if (type === "USAGE_BILLING" || (!type && amount > 100000)) {
        const existingUsage = await prisma.usagePayment.findUnique({
            where: { squadReference: reference }
        });

        if (!existingUsage) {
            const amountInNaira = amount / 100;
            const studentCount = metadata.studentCount || Math.round(amountInNaira / 2000);
            await withErrorHandling(async () => {
                await prisma.$transaction([
                    prisma.usagePayment.create({
                        data: {
                            schoolId,
                            amount: amountInNaira,
                            studentCount,
                            squadReference: reference,
                            status: "SUCCESS",
                            paidAt: new Date(),
                        }
                    }),
                    prisma.school.update({
                        where: { id: schoolId },
                        data: {
                            paidStudentCount: { increment: studentCount },
                            billingStatus: "ACTIVE"
                        }
                    })
                ]);
            });
        }
    } else {
        // Handle fee payment success
        if (!schoolId || !studentId) {
            return NextResponse.json({ 
                error: "Missing metadata in transaction", 
                received_metadata: metadata 
            }, { status: 400 });
        }

        const amountInNaira = amount / 100;
        const platformFee = amountInNaira * 0.02;
        const netAmount = amountInNaira - platformFee;

        await withErrorHandling(async () => {
            await prisma.$transaction(async (tx) => {
                // Record Squad Payment with explicit connections to avoid validation errors
                await tx.squadPayment.upsert({
                    where: { squadReference: reference },
                    update: { 
                        status: SquadPaymentStatus.SUCCESS, 
                        paidAt: new Date(),
                        amount: amountInNaira,
                        platformFee,
                        netAmount
                    },
                    create: {
                        squadReference: reference,
                        amount: amountInNaira,
                        platformFee,
                        netAmount,
                        status: SquadPaymentStatus.SUCCESS,
                        paidAt: new Date(),
                        metadata: metadata || {},
                        school: { connect: { id: schoolId } },
                        student: { connect: { id: studentId } },
                        feeId: feeId || null
                    }
                });

                // Update Wallet
                await tx.schoolWallet.upsert({
                    where: { schoolId },
                    update: { balance: { increment: netAmount } },
                    create: { schoolId, balance: netAmount },
                });

                // Update Assignment if applicable
                if (billAssignmentId) {
                    await tx.studentPayment.create({
                        data: {
                            studentId,
                            billAssignmentId,
                            amountPaid: amountInNaira,
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
                            data: { status: isFullyPaid ? "PAID" : "PARTIALLY_PAID" }
                        });
                    }
                }
            });
        });

        // Send Notifications as fallback
        try {
          const paymentData = await prisma.squadPayment.findUnique({
            where: { squadReference: reference },
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
            const amountVal = Number(paymentData.amount);

            // Notify Parents
            for (const studentParent of paymentData.student.parents) {
              const parentUser = studentParent.parent.user;
              await sendPaymentNotificationEmail({
                to: parentUser.email,
                recipientName: parentUser.name,
                studentName,
                amount: amountVal,
                billName,
                transactionRef: reference,
                date: new Date(),
                schoolName,
                schoolLogo: schoolLogo || undefined,
                isParent: true
              });
            }

            // Notify School
            await sendPaymentNotificationEmail({
              to: paymentData.school.email,
              recipientName: "Administrator",
              studentName,
              amount: amountVal,
              billName,
              transactionRef: reference,
              date: new Date(),
              schoolName,
              schoolLogo: schoolLogo || undefined,
              isParent: false
            });
          }
        } catch (notifyError) {
          console.error("Failed to send payment notifications (manual verify):", notifyError);
        }
    }

    return NextResponse.json({ 
        status: "success", 
        message: "Payment verified and recorded successfully" 
    });

  } catch (error: any) {
    console.error("Manual Verification Error:", error);
    return NextResponse.json({ 
        error: error.message || "Internal server error",
        status: "error"
    }, { status: 500 });
  }
}
