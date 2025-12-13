import { prisma } from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * GET /api/results/report
 * Generate a comprehensive result summary for a student
 * This endpoint is for generating report card data (not PDF - see /api/results/report-card for PDF)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const studentId = url.searchParams.get("studentId");
    const periodId = url.searchParams.get("periodId");
    const sessionId = url.searchParams.get("sessionId");

    if (!studentId || !periodId || !sessionId) {
      return NextResponse.json(
        { error: "studentId, periodId, and sessionId are required" },
        { status: 400 }
      );
    }

    // Fetch all results for the student in this period
    const results = await prisma.result.findMany({
      where: {
        studentId,
        periodId,
        sessionId,
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        componentScores: {
          include: {
            component: {
              select: {
                name: true,
                key: true,
                maxScore: true,
              },
            },
          },
        },
        period: {
          select: {
            name: true,
            weight: true,
          },
        },
      },
    });

    if (results.length === 0) {
      return NextResponse.json(
        { error: "No results found for this student" },
        { status: 404 }
      );
    }

    // Calculate totals and average
    const totalScore = results.reduce((sum, r) => sum + r.total, 0);
    const average = totalScore / results.length;

    // Get student information
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        classes: {
          where: {
            sessionId,
            status: "ACTIVE",
          },
          include: {
            class: {
              select: {
                id: true,
                name: true,
                section: true,
              },
            },
          },
        },
      },
    });

    // Build report summary
    const reportData = {
      student: {
        id: student?.id,
        name: student?.user.name,
        email: student?.user.email,
        class: student?.classes[0]?.class,
      },
      period: results[0].period.name,
      results: results.map((r) => ({
        subject: r.subject.name,
        subjectCode: r.subject.code,
        total: r.total,
        grade: r.grade,
        remark: r.remark,
        componentScores: r.componentScores.map((cs) => ({
          component: cs.component.name,
          score: cs.score,
          maxScore: cs.component.maxScore,
        })),
        teacherComment: r.teacherComment,
      })),
      summary: {
        totalSubjects: results.length,
        totalScore,
        average: parseFloat(average.toFixed(2)),
        overallGrade: results[0].grade, // TODO: Calculate overall grade based on average
      },
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Failed to generate report:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}

