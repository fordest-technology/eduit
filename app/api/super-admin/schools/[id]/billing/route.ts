import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole, BillingStatus } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: schoolId } = await params;
    const session = await getSession();
    
    if (!session || session.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { status } = await request.json();

    if (!Object.values(BillingStatus).includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    const updatedSchool = await prisma.school.update({
      where: { id: schoolId },
      data: { billingStatus: status as BillingStatus },
    });

    console.log(`[SUPER_ADMIN_BILLING] School ${schoolId} status updated to ${status} by ${session.id}`);

    return NextResponse.json(updatedSchool);
  } catch (error) {
    console.error("[SUPER_ADMIN_BILLING_PATCH]", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
