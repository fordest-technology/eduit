import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { billingService } from "@/lib/billing-service";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const billingInfo = await billingService.getBillingInfo(session.schoolId);
    return NextResponse.json(billingInfo);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
