import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/results/positions
 * Calculate student positions/rankings for Nigerian report cards
 * Query params: periodId, sessionId, classId (optional), studentId (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const periodId = searchParams.get("periodId");
    const sessionId = searchParams.get("sessionId");
    const classId = searchParams.get("classId");
    const studentId = searchParams.get("studentId");

    if (!periodId || !sessionId) {
      return NextResponse.json(
        { error: "periodId and sessionId are required" },
        { status: 400 }
      );
    }

    // Build base query
    const whereClause: any = {
      periodId,
      sessionId,
    };

    // Filter by school
    if (session.schoolId) {
      whereClause.student = {
        user: {
          schoolId: session.schoolId,
        },
      };
    }

    // If classId is provided, filter by class
    let classFilter: any = {};
    if (classId) {
      classFilter = {
        classes: {
          some: {
            classId,
            sessionId,
            status: "ACTIVE",
          },
        },
      };
    }

    // Fetch all results for the period/session
    const results = await prisma.result.findMany({
      where: whereClause,
      include: {
        student: {
          where: classFilter,
          include: {
            user: {
              select: {
                id: true,
                name: true,
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
                  },
                },
              },
            },
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Filter results if classId was specified (students not in class won't have classes array)
    const filteredResults = classId
      ? results.filter((r) => r.student.classes && r.student.classes.length > 0)
      : results;

    // Calculate overall position (total average across all subjects)
    const studentTotals = new Map<string, {
      studentId: string;
      studentName: string;
      totalScore: number;
      subjectCount: number;
      average: number;
      classId?: string;
      className?: string;
    }>();

    filteredResults.forEach((result) => {
      const existingData = studentTotals.get(result.studentId) || {
        studentId: result.studentId,
        studentName: result.student.user.name,
        totalScore: 0,
        subjectCount: 0,
        average: 0,
        classId: result.student.classes[0]?.class.id,
        className: result.student.classes[0]?.class.name,
      };

      existingData.totalScore += result.total;
      existingData.subjectCount += 1;
      existingData.average = existingData.totalScore / existingData.subjectCount;

      studentTotals.set(result.studentId, existingData);
    });

    // Sort by average to get overall positions
    const sortedStudents = Array.from(studentTotals.values()).sort(
      (a, b) => b.average - a.average
    );

    // Assign positions
    const overallPositions = sortedStudents.map((student, index) => ({
      ...student,
      position: index + 1,
      totalStudents: sortedStudents.length,
    }));

    // Calculate subject-wise positions
    const subjectPositions = new Map<string, any[]>();

    // Group results by subject
    const resultsBySubject = new Map<string, any[]>();
    filteredResults.forEach((result) => {
      const subjectResults = resultsBySubject.get(result.subjectId) || [];
      subjectResults.push(result);
      resultsBySubject.set(result.subjectId, subjectResults);
    });

    // Calculate positions for each subject
    resultsBySubject.forEach((subjectResults, subjectId) => {
      const sorted = [...subjectResults].sort((a, b) => b.total - a.total);

      const positions = sorted.map((result, index) => ({
        studentId: result.studentId,
        studentName: result.student.user.name,
        subjectId: result.subjectId,
        subjectName: result.subject.name,
        score: result.total,
        grade: result.grade,
        position: index + 1,
        totalStudents: sorted.length,
      }));

      subjectPositions.set(subjectId, positions);
    });

    // Calculate class statistics
    const classStats = {
      totalStudents: sortedStudents.length,
      highestAverage: sortedStudents[0]?.average || 0,
      lowestAverage: sortedStudents[sortedStudents.length - 1]?.average || 0,
      classAverage:
        sortedStudents.reduce((sum, s) => sum + s.average, 0) / sortedStudents.length || 0,
      subjectStats: Array.from(resultsBySubject.entries()).map(([subjectId, results]) => {
        const totals = results.map((r) => r.total);
        return {
          subjectId,
          subjectName: results[0]?.subject.name,
          highest: Math.max(...totals),
          lowest: Math.min(...totals),
          average: totals.reduce((a, b) => a + b, 0) / totals.length,
          totalStudents: totals.length,
        };
      }),
    };

    // If specific student requested, return their position data
    if (studentId) {
      const studentPosition = overallPositions.find((p) => p.studentId === studentId);
      const studentSubjectPositions = Array.from(subjectPositions.values())
        .flat()
        .filter((p) => p.studentId === studentId);

      return NextResponse.json({
        student: studentPosition,
        subjectPositions: studentSubjectPositions,
        classStats,
      });
    }

    // Return all positions
    return NextResponse.json({
      overallPositions,
      subjectPositions: Object.fromEntries(subjectPositions),
      classStats,
    });
  } catch (error) {
    console.error("Error calculating positions:", error);
    return NextResponse.json(
      { error: "Failed to calculate positions" },
      { status: 500 }
    );
  }
}
