import { db } from "@/lib/db";
import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * GET /api/results
 * Fetch results with proper schema and authorization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const subjectId = searchParams.get("subjectId");
    const periodId = searchParams.get("periodId");
    const sessionId = searchParams.get("sessionId");

    // Build where clause
    const whereClause: any = {};

    if (studentId) whereClause.studentId = studentId;
    if (subjectId) whereClause.subjectId = subjectId;
    if (periodId) whereClause.periodId = periodId;
    if (sessionId) whereClause.sessionId = sessionId;

    // School context - ensure user can only see results from their school
    if (session.schoolId) {
      whereClause.student = {
        user: {
          schoolId: session.schoolId,
        },
      };
    }

    const results = await db.result.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        period: {
          select: {
            id: true,
            name: true,
            weight: true,
          },
        },
        session: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
        componentScores: {
          include: {
            component: {
              select: {
                id: true,
                name: true,
                key: true,
                maxScore: true,
              },
            },
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Failed to fetch results:", error);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}

/**
 * POST /api/results
 * Create a single result entry with proper grade calculation
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, subjectId, periodId, sessionId, componentScores } = body;

    // Validation
    if (!studentId || !subjectId || !periodId || !sessionId || !Array.isArray(componentScores)) {
      return NextResponse.json(
        { error: "Missing required fields: studentId, subjectId, periodId, sessionId, componentScores" },
        { status: 400 }
      );
    }

    // Calculate total from component scores
    const total = componentScores.reduce(
      (sum: number, cs: any) => sum + (parseFloat(cs.score) || 0),
      0
    );

    // Get grading scale to calculate grade
    const period = await db.resultPeriod.findUnique({
      where: { id: periodId },
      include: {
        configuration: {
          include: {
            gradingScale: true,
          },
        },
      },
    });

    if (!period?.configuration) {
      return NextResponse.json(
        { error: "Result configuration not found for this period" },
        { status: 400 }
      );
    }

    // Find matching grade from grading scale
    const gradeScale = period.configuration.gradingScale.find(
      (scale: any) => total >= scale.minScore && total <= scale.maxScore
    );

    const grade = gradeScale?.grade || "N/A";
    const remark = gradeScale?.remark || "No grade applicable";

    // Create result with calculated grade
    const result = await db.result.create({
      data: {
        studentId,
        subjectId,
        periodId,
        sessionId,
        total,
        grade,
        remark,
        componentScores: {
          create: componentScores.map((cs: any) => ({
            componentId: cs.componentId,
            score: parseFloat(cs.score) || 0,
          })),
        },
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        subject: true,
        period: true,
        componentScores: {
          include: {
            component: true,
          },
        },
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create result:", error);
    return NextResponse.json({ error: "Failed to create result" }, { status: 500 });
  }
}
