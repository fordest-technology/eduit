import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { randomUUID } from "crypto";

/**
 * POST /api/wallets/withdraw
 * Process a withdrawal request from a school's wallet
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id || (session.role !== UserRole.SCHOOL_ADMIN && session.role !== UserRole.SUPER_ADMIN)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amount, bankCode, bankName, accountNumber, accountName } = body;

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

    // 2. Create Withdrawal Request (Manual fulfillment since Payvessel payout doc is missing)
    const transactionRef = `WD-${schoolId.substring(0, 8)}-${randomUUID().substring(0, 8)}`;
    
    await prisma.$transaction([
      // Create the record
      prisma.withdrawalRequest.create({
        data: {
          schoolId,
          amount,
          bankName: bankName || "Unknown Bank",
          bankCode,
          accountNumber,
          accountName,
          reference: transactionRef,
          status: "PENDING"
        }
      }),
      // Deduct from wallet balance
      prisma.schoolWallet.update({
        where: { schoolId },
        data: { balance: { decrement: amount } }
      }),
      // Log activity
      prisma.userActivityLog.create({
        data: {
          userId: session.id,
          page: "Wallet",
          action: "Withdrawal Requested",
          metadata: {
            amount,
            reference: transactionRef,
            bank: bankName,
            account: accountNumber
          }
        }
      })
    ]);

    return NextResponse.json({ 
      message: "Withdrawal request submitted for processing", 
      reference: transactionRef,
      status: "PENDING"
    });

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

    // Static list of major Nigerian banks
    const banks = [
        { code: "044", name: "Access Bank" },
        { code: "058", name: "Guaranty Trust Bank" },
        { code: "057", name: "Zenith Bank" },
        { code: "011", name: "First Bank of Nigeria" },
        { code: "033", name: "United Bank for Africa" },
        { code: "232", name: "Sterling Bank" },
        { code: "035", name: "Wema Bank" },
        { code: "070", name: "Fidelity Bank" },
        { code: "010", name: "9PSB" },
        { code: "999991", name: "Palmpay" },
        { code: "999992", name: "OPay" },
        { code: "050", name: "Ecobank Nigeria" },
        { code: "030", name: "Heritage Bank" },
        { code: "082", name: "Keystone Bank" },
        { code: "221", name: "Stanbic IBTC Bank" },
        { code: "032", name: "Union Bank of Nigeria" },
        { code: "215", name: "Unity Bank" },
    ];

    return NextResponse.json(banks);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch banks" }, { status: 500 });
  }
}
