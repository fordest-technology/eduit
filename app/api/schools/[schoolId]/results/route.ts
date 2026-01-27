import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const resultSchema = z.object({
  studentId: z.string(),
  subjectId: z.string(),
  periodId: z.string(),
  sessionId: z.string(),
  componentScores: z.array(
    z.object({
      componentId: z.string(),
      score: z.number(),
    })
  ),
  affectiveTraits: z.record(z.string()).optional(),
  psychomotorSkills: z.record(z.string()).optional(),
  customFields: z.record(z.string()).optional(),
  teacherComment: z.string().optional(),
  adminComment: z.string().optional(),
});

// Add type for scale parameter
interface GradeScale {
  minScore: number;
  maxScore: number;
  grade: string;
  remark: string;
}

// Add types for sum and result parameters
interface Result {
  total: number;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolId } = await params;
    
    // Authorization check
    if (session.role !== "SUPER_ADMIN" && session.schoolId !== schoolId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = resultSchema.parse(body);

    // Calculate total score and grade
    const components = await prisma.assessmentComponent.findMany({
      where: {
        id: {
          in: validatedData.componentScores.map((score) => score.componentId),
        },
      },
    });

    const total = validatedData.componentScores.reduce((sum, score) => {
      return sum + score.score;
    }, 0);

    // Get grading scale
    const period = await prisma.resultPeriod.findUnique({
      where: { id: validatedData.periodId },
      include: { configuration: { include: { gradingScale: true } } },
    });

    if (!period) {
      return NextResponse.json({ error: "Period not found" }, { status: 404 });
    }

    const grade = period.configuration.gradingScale.find(
      (scale) => total >= scale.minScore && total <= scale.maxScore
    );

    if (!grade) {
      return NextResponse.json(
        { error: "Invalid total score" },
        { status: 400 }
      );
    }

    // Calculate cumulative average
    const previousResults = await prisma.result.findMany({
      where: {
        studentId: validatedData.studentId,
        subjectId: validatedData.subjectId,
        sessionId: validatedData.sessionId,
        NOT: {
          periodId: validatedData.periodId,
        },
      },
    });

    const cumulativeAverage =
      previousResults.length > 0
        ? (previousResults.reduce((sum, result) => sum + result.total, 0) +
            total) /
          (previousResults.length + 1)
        : total;

    const result = await prisma.result.create({
      data: {
        studentId: validatedData.studentId,
        subjectId: validatedData.subjectId,
        periodId: validatedData.periodId,
        sessionId: validatedData.sessionId,
        total,
        grade: grade.grade,
        remark: grade.remark,
        cumulativeAverage,
        componentScores: {
          create: validatedData.componentScores,
        },
        affectiveTraits: validatedData.affectiveTraits,
        psychomotorSkills: validatedData.psychomotorSkills,
        customFields: validatedData.customFields,
        teacherComment: validatedData.teacherComment,
        adminComment: validatedData.adminComment,
      },
      include: {
        componentScores: {
          include: {
            component: true,
          },
        },
        student: true,
        subject: true,
        period: true,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating result:", error);
    return NextResponse.json(
      { error: "Failed to create result" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolId } = await params;

    // Authorization check
    if (session.role !== "SUPER_ADMIN" && session.schoolId !== schoolId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const subjectId = searchParams.get("subjectId");
    const periodId = searchParams.get("periodId");
    const sessionId = searchParams.get("sessionId");

    const results = await prisma.result.findMany({
      where: {
        ...(studentId && { studentId }),
        ...(subjectId && { subjectId }),
        ...(periodId && { periodId }),
        ...(sessionId && { sessionId }),
      },
      include: {
        componentScores: {
          include: {
            component: true,
          },
        },
        student: true,
        subject: true,
        period: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching results:", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolId } = await params;

    // Authorization check
    if (session.role !== "SUPER_ADMIN" && session.schoolId !== schoolId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...data } = body;
    const validatedData = resultSchema.parse(data);

    // Recalculate total score and grade
    const total = validatedData.componentScores.reduce((sum, score) => {
      return sum + score.score;
    }, 0);

    const period = await prisma.resultPeriod.findUnique({
      where: { id: validatedData.periodId },
      include: { configuration: { include: { gradingScale: true } } },
    });

    if (!period) {
      return NextResponse.json({ error: "Period not found" }, { status: 404 });
    }

    const grade = period.configuration.gradingScale.find(
      (scale) => total >= scale.minScore && total <= scale.maxScore
    );

    if (!grade) {
      return NextResponse.json(
        { error: "Invalid total score" },
        { status: 400 }
      );
    }

    // Recalculate cumulative average
    const otherResults = await prisma.result.findMany({
      where: {
        studentId: validatedData.studentId,
        subjectId: validatedData.subjectId,
        sessionId: validatedData.sessionId,
        NOT: {
          id,
          periodId: validatedData.periodId,
        },
      },
    });

    const cumulativeAverage =
      otherResults.length > 0
        ? (otherResults.reduce((sum, result) => sum + result.total, 0) +
            total) /
          (otherResults.length + 1)
        : total;

    const result = await prisma.result.update({
      where: { id },
      data: {
        total,
        grade: grade.grade,
        remark: grade.remark,
        cumulativeAverage,
        componentScores: {
          deleteMany: {},
          create: validatedData.componentScores,
        },
        affectiveTraits: validatedData.affectiveTraits,
        psychomotorSkills: validatedData.psychomotorSkills,
        customFields: validatedData.customFields,
        teacherComment: validatedData.teacherComment,
        adminComment: validatedData.adminComment,
      },
      include: {
        componentScores: {
          include: {
            component: true,
          },
        },
        student: true,
        subject: true,
        period: true,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating result:", error);
    return NextResponse.json(
      { error: "Failed to update result" },
      { status: 500 }
    );
  }
}
