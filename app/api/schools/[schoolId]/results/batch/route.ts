import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET handler to fetch results in batch for a class/period/session combination
export async function GET(
  request: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { schoolId } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to this school
    if (session.role !== "SUPER_ADMIN" && session.schoolId !== schoolId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const periodId = url.searchParams.get("periodId");
    const sessionId = url.searchParams.get("sessionId");
    const classId = url.searchParams.get("classId");

    if (!periodId || !sessionId) {
      return NextResponse.json(
        { error: "Missing required parameters: periodId and sessionId" },
        { status: 400 }
      );
    }

    // Build the query
    const query: any = {
      where: {
        periodId,
        sessionId,
      },
      include: {
        student: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
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
        componentScores: {
          include: {
            component: true,
          },
        },
      },
    };

    // Check for teacher permissions
    if (session.role === "TEACHER") {
      const teacherInfo = await prisma.teacher.findFirst({
        where: { userId: session.id },
        include: {
          classes: true,
          subjects: { include: { subject: true } },
        },
      });

      if (teacherInfo) {
        // If class is specified, check if teacher is assigned to this class
        if (classId) {
          const isAssignedToClass = teacherInfo.classes.some(
            (cls: any) => cls.id === classId
          );

          if (!isAssignedToClass) {
            // If teacher is not assigned to this class, restrict to subjects they teach
            const teacherSubjectIds = teacherInfo.subjects.map(
              (ts: any) => ts.subject.id
            );
            query.where.subjectId = { in: teacherSubjectIds };
          }
        } else {
          // No class specified, restrict to subjects they teach
          const teacherSubjectIds = teacherInfo.subjects.map(
            (ts: any) => ts.subject.id
          );
          query.where.subjectId = { in: teacherSubjectIds };
        }
      }
    }

    // Fetch the results
    const results = await prisma.result.findMany(query);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching batch results:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch results",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST handler for batch saving results - OPTIMIZED
export async function POST(
  request: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { schoolId } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to this school
    if (session.role !== "SUPER_ADMIN" && session.schoolId !== schoolId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { results } = body;

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty results array" },
        { status: 400 }
      );
    }

    // Check for teacher permissions ONCE
    let teacherSubjectIds: string[] = [];
    let teacherClassIds: string[] = [];

    if (session.role === "TEACHER") {
      const teacherInfo = await prisma.teacher.findFirst({
        where: { userId: session.id },
        select: {
          classes: { select: { id: true } },
          subjects: { select: { subjectId: true } },
        },
      });

      if (teacherInfo) {
        teacherSubjectIds = teacherInfo.subjects.map((ts: any) => ts.subjectId);
        teacherClassIds = teacherInfo.classes.map((cls: any) => cls.id);
      }
    }

    // Filter results based on permissions
    const permittedResults = session.role === "TEACHER" 
      ? results.filter((result: any) => {
          const isAssignedToClass = result.classId && teacherClassIds.includes(result.classId);
          const isAssignedToSubject = teacherSubjectIds.includes(result.subjectId);
          return isAssignedToClass || isAssignedToSubject;
        })
      : results;

    if (permittedResults.length === 0) {
      return NextResponse.json({ 
        message: "No permitted results to save", 
        count: 0 
      });
    }

    // Build lookup keys for existing results - fetch in ONE query
    const lookupConditions = permittedResults.map((r: any) => ({
      studentId: r.studentId,
      subjectId: r.subjectId,
      periodId: r.periodId,
      sessionId: r.sessionId,
    }));

    // Get all existing results in ONE query
    const existingResults = await prisma.result.findMany({
      where: {
        OR: lookupConditions,
      },
      select: {
        id: true,
        studentId: true,
        subjectId: true,
        periodId: true,
        sessionId: true,
        grade: true,
        remark: true,
      },
    });

    // Create lookup map for fast access
    const existingMap = new Map(
      existingResults.map(r => [
        `${r.studentId}-${r.subjectId}-${r.periodId}-${r.sessionId}`,
        r
      ])
    );

    // Prepare data for updates and creates
    const resultsToCreate: any[] = [];
    const resultsToUpdate: any[] = [];
    const componentScoresToCreate: any[] = [];
    const resultIdsToDeleteScores: string[] = [];

    for (const result of permittedResults) {
      const key = `${result.studentId}-${result.subjectId}-${result.periodId}-${result.sessionId}`;
      const existing = existingMap.get(key);
      const total = result.componentScores.reduce(
        (sum: number, cs: any) => sum + (parseFloat(cs.score) || 0),
        0
      );

      if (existing) {
        resultIdsToDeleteScores.push(existing.id);
        resultsToUpdate.push({
          where: { id: existing.id },
          data: {
            total,
            grade: result.grade || existing.grade || "N/A",
            remark: result.remark || existing.remark || "Pending",
            updatedAt: new Date(),
          },
        });
        // Add component scores with existing result ID
        for (const cs of result.componentScores) {
          if (cs.componentId) {
            componentScoresToCreate.push({
              componentId: cs.componentId,
              resultId: existing.id,
              score: parseFloat(cs.score) || 0,
            });
          }
        }
      } else {
        resultsToCreate.push({
          studentId: result.studentId,
          subjectId: result.subjectId,
          periodId: result.periodId,
          sessionId: result.sessionId,
          total,
          grade: result.grade || "N/A",
          remark: result.remark || "Pending",
          _componentScores: result.componentScores, // temp storage
        });
      }
    }

    // Execute everything in a TRANSACTION for speed and consistency
    const savedCount = await prisma.$transaction(async (tx) => {
      // 1. Delete old component scores for updates (batch)
      if (resultIdsToDeleteScores.length > 0) {
        await tx.componentScore.deleteMany({
          where: { resultId: { in: resultIdsToDeleteScores } },
        });
      }

      // 2. Update existing results (batch)
      for (const update of resultsToUpdate) {
        await tx.result.update(update);
      }

      // 3. Create new results
      const createdResults: any[] = [];
      for (const createData of resultsToCreate) {
        const { _componentScores, ...resultData } = createData;
        const newResult = await tx.result.create({ data: resultData });
        createdResults.push({ result: newResult, scores: _componentScores });
      }

      // 4. Add component scores for new results
      for (const { result, scores } of createdResults) {
        for (const cs of scores) {
          if (cs.componentId) {
            componentScoresToCreate.push({
              componentId: cs.componentId,
              resultId: result.id,
              score: parseFloat(cs.score) || 0,
            });
          }
        }
      }

      // 5. Create all component scores in ONE batch
      if (componentScoresToCreate.length > 0) {
        await tx.componentScore.createMany({
          data: componentScoresToCreate,
        });
      }

      return resultsToUpdate.length + createdResults.length;
    });

    return NextResponse.json({
      message: `Successfully saved ${savedCount} results`,
      count: savedCount,
    });
  } catch (error) {
    console.error("Error saving batch results:", error);
    return NextResponse.json(
      {
        error: "Failed to save results",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

