import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "5");
    const schoolId = searchParams.get("schoolId") || session.schoolId;

    const now = new Date();

    const events = await prisma.event.findMany({
      where: {
        startDate: {
          gte: now,
        },
        schoolId: schoolId,
        OR: [
          { isPublic: true },
          {
            AND: [
              { isPublic: false },
              {
                OR: [
                  { schoolId: session.schoolId },
                  {
                    schoolId:
                      session.role === "SCHOOL_ADMIN" ? schoolId : undefined,
                  },
                ],
              },
            ],
          },
        ],
      },
      orderBy: {
        startDate: "asc",
      },
      take: limit,
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    return NextResponse.json(
      { error: "Failed to fetch upcoming events" },
      { status: 500 }
    );
  }
}
