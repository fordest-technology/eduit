import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch both fee payments (parent to school) and usage payments (school to EduIT)
    const [fees, usage, withdrawals] = await Promise.all([
      prisma.squadPayment.findMany({
        where: { schoolId: session.schoolId, status: "SUCCESS" },
        include: {
          student: {
            include: {
              user: { select: { name: true } }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 10
      }),
      prisma.usagePayment.findMany({
        where: { schoolId: session.schoolId, status: "SUCCESS" },
        orderBy: { createdAt: "desc" },
        take: 10
      }),
      prisma.userActivityLog.findMany({
        where: { 
          user: { schoolId: session.schoolId },
          action: "WALLET_WITHDRAWAL"
        },
        orderBy: { createdAt: "desc" },
        take: 10
      })
    ]);

    // Format into a unified transaction list
    const transactions = [
      ...fees.map((f: any) => ({
        id: f.id,
        type: "FEE_COLLECTION",
        amount: f.amount.toNumber(),
        description: `School fee for ${f.student?.user?.name || "Student"}`,
        date: f.createdAt,
        status: "SUCCESS"
      })),
      ...usage.map((u: any) => ({
        id: u.id,
        type: "USAGE_BILLING",
        amount: -u.amount.toNumber(),
        description: `EduIT Usage Billing (${u.studentCount} students)`,
        date: u.createdAt,
        status: "SUCCESS"
      })),
      ...withdrawals.map((w: any) => {
        let amount = 0;
        try {
          const metadata = typeof w.metadata === 'string' ? JSON.parse(w.metadata) : w.metadata;
          amount = metadata?.amount || 0;
        } catch (e) {
          console.error("Failed to parse withdrawal metadata", e);
        }
        return {
          id: w.id,
          type: "WITHDRAWAL",
          amount: -amount,
          description: "Funds Withdrawal",
          date: w.createdAt,
          status: "SUCCESS"
        };
      })
    ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    return NextResponse.json(transactions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
