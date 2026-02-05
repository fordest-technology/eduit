import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { payvesselClient } from "@/lib/payvessel";

/**
 * POST /api/school/wallet/virtual-account
 * Creates a static virtual account for the school to receive payments from parents.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
        firstName, 
        lastName, 
        email, 
        phoneNumber, 
        bvn, 
        dob, 
        gender, 
        address 
    } = body;

    // 1. Fetch School Details
    const school = await prisma.school.findUnique({
      where: { id: session.schoolId },
      select: { 
        name: true, 
        email: true,
        bankAccountNumber: true,
        bankCode: true,
        squadWalletId: true
      }
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Idempotency Check
    if (school.bankAccountNumber) {
       return NextResponse.json({ 
        message: "School virtual account already active", 
        data: {
          account_number: school.bankAccountNumber,
          bank_code: school.bankCode,
          virtual_account_reference: school.squadWalletId
        } 
       });
    }

    // 2. Create Static Virtual Account via Payvessel
    const fullName = `${firstName} ${lastName}`.trim();
    
    const payvesselResponse = await payvesselClient.createVirtualAccount({
      email: email || school.email,
      name: fullName || school.name,
      phoneNumber: phoneNumber,
      bankcode: ["999991", "120001"], // Palmpay and 9PSB
      account_type: "STATIC",
      bvn: bvn,
    });

    if (payvesselResponse.status) {
      const vaData = payvesselResponse.banks[0]; // Take the first bank
      
      await prisma.school.update({
        where: { id: session.schoolId },
        data: {
          bankAccountNumber: vaData.accountNumber,
          bankCode: vaData.bankCode,
          squadWalletId: vaData.trackingReference // Reusing squadWalletId field for reference
        }
      });

      return NextResponse.json({ 
        message: "School virtual account activated successfully", 
        data: vaData 
      });
    } else {
      return NextResponse.json({ 
        error: payvesselResponse.message || "Failed to create virtual account" 
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Critical Virtual Account Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
