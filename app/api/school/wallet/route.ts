import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [wallet, feesAgg, usageAgg, school] = await Promise.all([
      prisma.schoolWallet.findUnique({
        where: { schoolId: session.schoolId }
      }),
      prisma.squadPayment.aggregate({
        where: { schoolId: session.schoolId, status: "SUCCESS" },
        _sum: { amount: true }
      }),
      prisma.usagePayment.aggregate({
        where: { schoolId: session.schoolId, status: "SUCCESS" },
        _sum: { amount: true }
      }),
      prisma.school.findUnique({
        where: { id: session.schoolId },
        select: { bankAccountNumber: true, bankCode: true, name: true }
      })
    ]);

    return NextResponse.json({ 
      balance: wallet?.balance.toNumber() || 0,
      totalFeesCollected: feesAgg._sum.amount?.toNumber() || 0,
      totalUsagePaid: usageAgg._sum.amount?.toNumber() || 0,
      bankAccountNumber: school?.bankAccountNumber,
      bankCode: school?.bankCode,
      schoolName: school?.name
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
