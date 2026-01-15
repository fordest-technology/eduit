import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { squadClient } from "@/lib/squad";
import { UserRole } from "@prisma/client";
import { randomUUID } from "crypto";

/**
 * POST /api/wallets/withdraw
 * Process a withdrawal from a school's wallet to their bank account
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id || (session.role !== UserRole.SCHOOL_ADMIN && session.role !== UserRole.SUPER_ADMIN)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amount, bankCode, accountNumber, accountName } = body;

    if (!amount || !bankCode || !accountNumber || !accountName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const schoolId = session.schoolId!;

    // 1. Verify wallet balance
    const wallet = await prisma.schoolWallet.findUnique({
      where: { schoolId }
    });

    if (!wallet || wallet.balance.toNumber() < amount) {
      return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });
    }

    // 2. Initiate Squad Payout
    const transactionRef = `WD-${schoolId.substring(0, 8)}-${randomUUID().substring(0, 8)}`;
    
    const payoutResponse = await squadClient.initiatePayout({
      amount: amount * 100, // Convert to kobo
      currency: "NGN",
      remark: `Withdrawal for ${session.schoolId}`,
      bank_code: bankCode,
      account_number: accountNumber,
      account_name: accountName,
      transaction_reference: transactionRef
    });

    if (payoutResponse.status === "success" || payoutResponse.status === 200) {
      // 3. Deduct from wallet balance and record activity
      await prisma.$transaction([
        prisma.schoolWallet.update({
          where: { schoolId },
          data: { balance: { decrement: amount } }
        }),
        prisma.userActivityLog.create({
          data: {
            userId: session.id,
            page: "Wallet",
            action: "Withdrawal",
            metadata: {
              amount,
              reference: transactionRef,
              bank: bankCode,
              account: accountNumber
            }
          }
        })
      ]);

      return NextResponse.json({ 
        message: "Withdrawal processed successfully", 
        data: payoutResponse.data 
      });
    } else {
      console.error("Squad Payout Error:", payoutResponse);
      return NextResponse.json({ error: "Failed to process withdrawal via Squad" }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Withdrawal Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/wallets/withdraw
 * Lists available banks for withdrawal
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await squadClient.getBanks();
    return NextResponse.json(response.data || []);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch banks" }, { status: 500 });
  }
}
