import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * Webhook Handler for Payment Gateway (Paystack/Flutterwave/Monnify)
 * This endpoint receives payment notifications and automatically credits school wallets
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Verify webhook signature (example for Paystack)
        const hash = crypto
            .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY || "")
            .update(JSON.stringify(body))
            .digest("hex");

        const signature = request.headers.get("x-paystack-signature");

        if (hash !== signature) {
            console.error("[Webhook] Invalid signature");
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        const event = body.event;
        const data = body.data;

        console.log(`[Webhook] Received event: ${event}`);

        // Handle successful payment
        if (event === "charge.success" || event === "transfer.success") {
            const { reference, amount, customer, metadata } = data;

            // Extract school ID and student ID from metadata
            const schoolId = metadata?.schoolId;
            const studentId = metadata?.studentId;
            const billAssignmentId = metadata?.billAssignmentId;

            if (!schoolId) {
                console.error("[Webhook] Missing schoolId in metadata");
                return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
            }

            // Process payment in a transaction
            await prisma.$transaction(async (tx) => {
                // 1. Get or create school wallet
                let wallet = await tx.schoolWallet.findUnique({
                    where: { schoolId },
                });

                if (!wallet) {
                    wallet = await tx.schoolWallet.create({
                        data: {
                            schoolId,
                            balance: 0,
                        },
                    });
                }

                // 2. Create credit transaction
                await tx.walletTransaction.create({
                    data: {
                        walletId: wallet.id,
                        amount: amount / 100, // Convert kobo to naira
                        type: "CREDIT",
                        status: "SUCCESS",
                        reference,
                        description: `Payment from ${customer?.email || "customer"}`,
                        metadata: {
                            studentId,
                            billAssignmentId,
                            gateway: "paystack",
                            raw: data,
                        },
                    },
                });

                // 3. Update wallet balance
                await tx.schoolWallet.update({
                    where: { id: wallet.id },
                    data: {
                        balance: {
                            increment: amount / 100,
                        },
                    },
                });

                // 4. Mark bill as paid if billAssignmentId exists
                if (billAssignmentId && studentId) {
                    // Check if this payment completes the bill
                    const billAssignment = await tx.billAssignment.findUnique({
                        where: { id: billAssignmentId },
                        include: { bill: true },
                    });

                    if (billAssignment) {
                        const totalPaid = await tx.studentPayment.aggregate({
                            where: { billAssignmentId },
                            _sum: { amountPaid: true },
                        });

                        const currentPaid = (totalPaid._sum.amountPaid || 0) + amount / 100;

                        // Create student payment record
                        await tx.studentPayment.create({
                            data: {
                                billAssignmentId,
                                studentId,
                                amountPaid: amount / 100,
                            },
                        });

                        // Update bill assignment status
                        if (currentPaid >= billAssignment.bill.amount) {
                            await tx.billAssignment.update({
                                where: { id: billAssignmentId },
                                data: { status: "PAID" },
                            });
                        } else if (currentPaid > 0) {
                            await tx.billAssignment.update({
                                where: { id: billAssignmentId },
                                data: { status: "PARTIALLY_PAID" },
                            });
                        }
                    }
                }
            });

            console.log(`[Webhook] Successfully processed payment: ${reference}`);
            return NextResponse.json({ message: "Payment processed successfully" });
        }

        // Handle failed payment
        if (event === "charge.failed") {
            console.warn(`[Webhook] Payment failed: ${data.reference}`);
            // You can log this or notify the user
        }

        return NextResponse.json({ message: "Event received" });
    } catch (error) {
        console.error("[Webhook] Error processing payment:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
