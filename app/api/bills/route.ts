import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, PrismaClient } from "@prisma/client";

interface CreateBillItem {
  name: string;
  amount: number;
  description?: string | null;
}

interface CreateBillRequest {
  name: string;
  items: CreateBillItem[];
  accountId: string;
}

type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication & Authorization
    const session = await getSession(null);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { admin: true },
    });

    if (!user?.admin || !user.schoolId) {
      return NextResponse.json(
        { error: "Only school admins can create bills" },
        { status: 403 }
      );
    }

    // 2. Request Validation
    const body = await req.json();
    const { name, items, accountId } = body as CreateBillRequest;

    if (!name?.trim() || !items?.length || !accountId?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 3. Data Validation
    const hasInvalidAmount = items.some(
      (item) => isNaN(item.amount) || item.amount <= 0
    );
    if (hasInvalidAmount) {
      return NextResponse.json(
        { error: "All items must have valid positive amounts" },
        { status: 400 }
      );
    }

    // 4. Business Logic
    const totalAmount = items.reduce((total, item) => total + item.amount, 0);

    const account = await prisma.paymentAccount.findFirst({
      where: {
        id: accountId,
        schoolId: user.schoolId,
        isActive: true,
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Invalid or inactive payment account" },
        { status: 400 }
      );
    }

    // 5. Transaction with proper error handling
    try {
      const result = await prisma.$transaction(
        async (prisma) => {
          // Create the bill with only the fields that exist in the schema
          const bill = await prisma.bill.create({
            data: {
              name: name.trim(),
              amount: totalAmount,
              schoolId: user.schoolId as string,
              accountId: accountId,
            },
          });

          // Create bill items with description field
          const billItems = [];
          for (const item of items) {
            const billItem = await prisma.billItem.create({
              data: {
                billId: bill.id,
                name: item.name.trim(),
                amount: item.amount,
              },
            });
            billItems.push(billItem);
          }

          // Return complete bill with relations
          const completeBill = await prisma.bill.findUnique({
            where: { id: bill.id },
            include: {
              items: true,
              account: {
                select: {
                  id: true,
                  name: true,
                  accountNo: true,
                  bankName: true,
                  branchCode: true,
                  description: true,
                  isActive: true,
                },
              },
            },
          });

          if (!completeBill) {
            throw new Error("Failed to create bill");
          }

          return completeBill;
        },
        {
          timeout: 10000,
          maxWait: 5000,
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }
      );

      return NextResponse.json(result, { status: 201 });
    } catch (transactionError) {
      console.error("Transaction failed:", transactionError);
      throw new Error(
        `Transaction failed: ${
          transactionError instanceof Error
            ? transactionError.message
            : "Unknown error"
        }`
      );
    }
  } catch (error) {
    console.error("Error in bill creation endpoint:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create bill",
        ...(process.env.NODE_ENV === "development" && {
          stack: error instanceof Error ? error.stack : undefined,
          details: error,
        }),
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // 1. Authentication & Authorization
    const session = await getSession(null);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { admin: true },
    });

    if (!user?.schoolId) {
      return NextResponse.json(
        { error: "User not associated with a school" },
        { status: 403 }
      );
    }

    // 2. Fetch bills with related data
    const bills = await prisma.bill.findMany({
      where: {
        schoolId: user.schoolId,
      },
      include: {
        items: true,
        account: {
          select: {
            id: true,
            name: true,
            accountNo: true,
            bankName: true,
            branchCode: true,
            description: true,
            isActive: true,
          },
        },
        assignments: {
          include: {
            studentPayments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(bills);
  } catch (error) {
    console.error("Error fetching bills:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch bills",
        ...(process.env.NODE_ENV === "development" && {
          stack: error instanceof Error ? error.stack : undefined,
          details: error,
        }),
      },
      { status: 500 }
    );
  }
}
