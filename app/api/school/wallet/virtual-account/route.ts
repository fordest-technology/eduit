import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { squadClient } from "@/lib/squad";

/**
 * POST /api/school/wallet/virtual-account
 * Creates a fixed virtual account for the school to receive payments from parents.
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

    // 1. Fetch School Details for Business VA
    const school = await prisma.school.findUnique({
      where: { id: session.schoolId },
      select: { name: true, email: true }
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // 2. Create Business Virtual Account (The Proper Way for Schools)
    const squadResponse = await squadClient.createBusinessVirtualAccount({
      bvn: bvn,
      business_name: school.name,
      customer_identifier: `SCH-${session.schoolId.substring(0, 10)}`,
      mobile_num: phoneNumber,
    }).catch(e => e.response?.data || { status: 400, message: e.message });

    if (squadResponse.status === 200 || squadResponse.success) {
      const vaData = squadResponse.data;
      
      await prisma.school.update({
        where: { id: session.schoolId },
        data: {
          bankAccountNumber: vaData.account_number,
          bankCode: vaData.bank_code || "000",
          squadWalletId: vaData.virtual_account_reference
        }
      });

      return NextResponse.json({ 
        message: "School virtual account activated successfully", 
        data: vaData 
      });
    } else {
      // Fallback to individual route if business fails
      console.warn("Business VA failed, trying individual fallback...", squadResponse.message);
      
      const [y, m, d] = dob.split("-");
      const formattedDob = `${m}/${d}/${y}`;

      const fallbackResponse = await squadClient.createVirtualAccount({
        first_name: firstName,
        last_name: lastName,
        mobile_num: phoneNumber,
        dob: formattedDob,
        email: email,
        bvn: bvn,
        gender: gender,
        address: address,
        customer_identifier: `SCH-${session.schoolId.substring(0, 10)}`
      }).catch(e => e.response?.data || { status: 400, message: e.message });

      if (fallbackResponse.status === 200 || fallbackResponse.success) {
          const vaData = fallbackResponse.data;
          await prisma.school.update({
              where: { id: session.schoolId },
              data: {
                  bankAccountNumber: vaData.account_number,
                  bankCode: vaData.bank_code || "000",
                  squadWalletId: vaData.virtual_account_reference
              }
          });
          return NextResponse.json({ message: "Account activated (Individual Route)", data: vaData });
      }

      return NextResponse.json({ 
        error: fallbackResponse.message || squadResponse.message || "Failed to create virtual account" 
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Critical Virtual Account Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
