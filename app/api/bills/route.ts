import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/bills - Get all bills for the school
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
        { error: "Only school admins can access bills" },
        { status: 403 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");
    const classId = searchParams.get("classId");
    const studentId = searchParams.get("studentId");

    // Base query to get all bills for the school
    let query: any = {
      where: { schoolId: user.schoolId },
      include: {
        account: true,
        assignments: {
          include: {
            studentPayments: {
              include: {
                student: {
                  include: {
                    user: {
                      select: {
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    // Apply filters based on query parameters
    if (classId || studentId || status) {
      query.include.assignments.where = {};

      if (classId) {
        query.include.assignments.where.AND = [
          { targetType: "CLASS" },
          { targetId: classId },
        ];
      }

      if (studentId) {
        query.include.assignments.where.OR = [
          {
            AND: [{ targetType: "STUDENT" }, { targetId: studentId }],
          },
          {
            studentPayments: {
              some: {
                studentId: studentId,
              },
            },
          },
        ];
      }

      if (status) {
        query.include.assignments.where.status = status;
      }
    }

    const bills = await prisma.bill.findMany(query);

    return NextResponse.json(bills);
  } catch (error) {
    console.error("Error fetching bills:", error);
    return NextResponse.json(
      { error: "Failed to fetch bills" },
      { status: 500 }
    );
  }
}

// POST /api/bills - Create a new bill
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
        { error: "Only school admins can create bills" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, amount, description, accountId, assignments } = body;

    if (
      !name ||
      !amount ||
      !accountId ||
      !assignments ||
      assignments.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if payment account exists and belongs to the school
    const accountExists = await prisma.paymentAccount.findFirst({
      where: {
        id: accountId,
        schoolId: user.schoolId,
      },
    });

    if (!accountExists) {
      return NextResponse.json(
        { error: "Invalid payment account" },
        { status: 400 }
      );
    }

    // Create bill with assignments
    const bill = await prisma.bill.create({
      data: {
        name,
        amount,
        description,
        schoolId: user.schoolId,
        accountId,
        assignments: {
          create: assignments.map((assignment: any) => ({
            targetType: assignment.targetType,
            targetId: assignment.targetId,
            dueDate: new Date(assignment.dueDate),
          })),
        },
      },
      include: {
        assignments: true,
        account: true,
      },
    });

    return NextResponse.json(bill, { status: 201 });
  } catch (error) {
    console.error("Error creating bill:", error);
    return NextResponse.json(
      { error: "Failed to create bill" },
      { status: 500 }
    );
  }
}
