import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ schoolId: string }> }
) {
    try {
        const { schoolId } = await params;
        const session = await getSession();

        if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "SCHOOL_ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user has access to this school
        if (session.role !== "SUPER_ADMIN" && session.schoolId !== schoolId) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Get or create wallet for the school
        let wallet = await prisma.schoolWallet.findUnique({
            where: { schoolId },
            include: {
                transactions: {
                    orderBy: { createdAt: "desc" },
                    take: 50, // Last 50 transactions
                },
            },
        });

        // If wallet doesn't exist, create it
        if (!wallet) {
            wallet = await prisma.schoolWallet.create({
                data: {
                    schoolId,
                    balance: 0,
                },
                include: {
                    transactions: true,
                },
            });
        }

        return NextResponse.json(wallet);
    } catch (error) {
        console.error("Error fetching wallet:", error);
        return NextResponse.json({ error: "Failed to fetch wallet" }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ schoolId: string }> }
) {
    try {
        const { schoolId } = await params;
        const session = await getSession();

        if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "SCHOOL_ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.role !== "SUPER_ADMIN" && session.schoolId !== schoolId) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const { action, amount, reference, description } = await request.json();

        if (action === "withdraw") {
            // Get wallet
            const wallet = await prisma.schoolWallet.findUnique({
                where: { schoolId },
            });

            if (!wallet || wallet.balance < amount) {
                return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
            }

            // Create withdrawal transaction and update balance
            const result = await prisma.$transaction(async (tx) => {
                // Create debit transaction
                const transaction = await tx.walletTransaction.create({
                    data: {
                        walletId: wallet.id,
                        amount,
                        type: "DEBIT",
                        status: "PENDING",
                        reference: reference || `WD-${Date.now()}`,
                        description: description || "Withdrawal to bank account",
                    },
                });

                // Update wallet balance
                const updatedWallet = await tx.schoolWallet.update({
                    where: { id: wallet.id },
                    data: {
                        balance: {
                            decrement: amount,
                        },
                    },
                });

                return { transaction, wallet: updatedWallet };
            });

            return NextResponse.json(result);
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("Error processing wallet action:", error);
        return NextResponse.json({ error: "Failed to process action" }, { status: 500 });
    }
}
