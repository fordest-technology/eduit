import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/payment-accounts - Get all payment accounts for the school
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(null);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { admin: true },
    });

    if (!user || !user.admin || !user.schoolId) {
      return NextResponse.json(
        { error: "Only school admins can access payment accounts" },
        { status: 403 }
      );
    }

    const accounts = await prisma.paymentAccount.findMany({
      where: { schoolId: user.schoolId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Error fetching payment accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment accounts" },
      { status: 500 }
    );
  }
}

// POST /api/payment-accounts - Create a new payment account
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(null);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { admin: true },
    });

    if (!user || !user.admin || !user.schoolId) {
      return NextResponse.json(
        { error: "Only school admins can create payment accounts" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, accountNo, bankName, branchCode, description } = body;

    if (!name || !accountNo || !bankName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const account = await prisma.paymentAccount.create({
      data: {
        name,
        accountNo,
        bankName,
        branchCode,
        description,
        schoolId: user.schoolId,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error("Error creating payment account:", error);
    return NextResponse.json(
      { error: "Failed to create payment account" },
      { status: 500 }
    );
  }
}
