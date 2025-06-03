import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET handler to fetch results in batch for a class/period/session combination
export async function GET(
  request: Request,
  { params }: { params: { schoolId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to this school
    if (session.schoolId !== params.schoolId) {
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

// POST handler for batch saving results
export async function POST(
  request: Request,
  { params }: { params: { schoolId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to this school
    if (session.schoolId !== params.schoolId) {
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

    // Check for teacher permissions
    let teacherSubjectIds: string[] = [];
    let teacherClassIds: string[] = [];

    if (session.role === "TEACHER") {
      const teacherInfo = await prisma.teacher.findFirst({
        where: { userId: session.id },
        include: {
          classes: true,
          subjects: { include: { subject: true } },
        },
      });

      if (teacherInfo) {
        teacherSubjectIds = teacherInfo.subjects.map(
          (ts: any) => ts.subject.id
        );
        teacherClassIds = teacherInfo.classes.map((cls: any) => cls.id);
      }
    }

    // Process each result
    const resultPromises = results.map(async (result: any) => {
      // Check teacher permissions
      if (session.role === "TEACHER") {
        const isAssignedToClass =
          result.classId && teacherClassIds.includes(result.classId);
        const isAssignedToSubject = teacherSubjectIds.includes(
          result.subjectId
        );

        if (!isAssignedToClass && !isAssignedToSubject) {
          throw new Error(
            `Permission denied for subject ${result.subjectId} in class ${result.classId}`
          );
        }
      }

      // Check if the result already exists
      const existingResult = await prisma.result.findFirst({
        where: {
          studentId: result.studentId,
          subjectId: result.subjectId,
          periodId: result.periodId,
          sessionId: result.sessionId,
        },
        include: {
          componentScores: true,
        },
      });

      if (existingResult) {
        // Update existing result and component scores
        const updatedResult = await prisma.result.update({
          where: { id: existingResult.id },
          data: {
            // Update main result fields
            updatedAt: new Date(),
            // Add required fields
            total: result.componentScores.reduce(
              (sum: number, cs: any) => sum + (parseFloat(cs.score) || 0),
              0
            ),
            grade: result.grade || existingResult.grade || "N/A", // Use existing if available
            remark: result.remark || existingResult.remark || "Pending", // Use existing if available

            // Update component scores
            componentScores: {
              // Delete existing scores
              deleteMany: {},
              // Create new scores
              createMany: {
                data: result.componentScores.map((cs: any) => ({
                  componentKey: cs.componentKey,
                  score: cs.score,
                })),
              },
            },
          },
        });

        return updatedResult;
      } else {
        // Create new result with component scores
        const newResult = await prisma.result.create({
          data: {
            studentId: result.studentId,
            subjectId: result.subjectId,
            periodId: result.periodId,
            sessionId: result.sessionId,
            // Add required fields
            total: result.componentScores.reduce(
              (sum: number, cs: any) => sum + (parseFloat(cs.score) || 0),
              0
            ),
            grade: result.grade || "N/A", // Default grade or from input
            remark: result.remark || "Pending", // Default remark
            componentScores: {
              createMany: {
                data: result.componentScores.map((cs: any) => ({
                  componentKey: cs.componentKey,
                  score: cs.score,
                })),
              },
            },
          },
        });

        return newResult;
      }
    });

    // Execute all promises
    const savedResults = await Promise.all(resultPromises);

    return NextResponse.json({
      message: `Successfully saved ${savedResults.length} results`,
      count: savedResults.length,
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
