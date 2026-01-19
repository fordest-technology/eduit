import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import * as z from "zod";

export async function GET(
  req: Request,
  { params }: { params: { schoolId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Await params for Next.js 15
    const { schoolId } = await Promise.resolve(params);

    // Verify access to school
    if (session.schoolId !== schoolId && session.role !== "SUPER_ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Get query parameters
    const url = new URL(req.url);
    const periodId = url.searchParams.get("periodId");
    const sessionId = url.searchParams.get("sessionId");
    const classId = url.searchParams.get("classId");
    const subjectId = url.searchParams.get("subjectId");

    if (!periodId || !sessionId) {
      return new NextResponse("Missing required parameters: periodId and sessionId", { status: 400 });
    }

    // Build filter
    const where: any = {
      periodId,
      sessionId,
      student: {
        schoolId, // Ensure filtering by school
      }
    };

    if (classId) {
       // Filter results where student belongs to the class
       // But wait, Result model DOES NOT have classId.
       // It links to Student.
       // Student has `currentClass` or `studentClasses`.
       // We need to filter results where student is currently in classId.
       // However, reusing historical results might be tricky if student changed class.
       // Assuming `studentClasses` tracks history, BUT simple `currentClassId` might be enough for now if we assume termly structure.
       // Let's check schema again. `Student` has `classId` (current class).
       // Also `StudentClass` history.
       
       // For strictness, we should use the `classId` from the student at the time?
       // The `Result` doesn't store `classId`.
       // This is a common design issue. Ideally Result should store `classId`.
       // Schema check: Result { studentId, subjectId, ... } (Step 1369 lines 48-60)
       // It doesn't have classId.
       
       // So we filter students who are *currently* in the class, OR track history.
       // For this simple implementation, we filter by student's current class ID or use `StudentClass` logic if available.
       // Let's use `student: { classId: classId }` which assumes current class.
       where.student = {
         ...where.student,
         classId,
       };
    }

    if (subjectId && subjectId !== 'all') {
      where.subjectId = subjectId;
    }

    const results = await prisma.result.findMany({
      where,
      include: {
        componentScores: {
          include: {
            assessmentComponent: true
          }
        },
        student: {
          select: {
            id: true,
            user: {
              select: {
                name: true
              }
            },
            rollNumber: true
          }
        },
        subject: {
            select: {
                id: true,
                name: true,
                code: true
            }
        }
      }
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("[RESULTS_BATCH_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

const batchResultSchema = z.object({
  results: z.array(z.object({
    studentId: z.string(),
    subjectId: z.string(),
    periodId: z.string(),
    sessionId: z.string(),
    classId: z.string().optional(),
    componentScores: z.array(z.object({
      componentId: z.string(),
      score: z.number().min(0)
    }))
  }))
});

export async function POST(
  req: Request,
  { params }: { params: { schoolId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { schoolId } = await Promise.resolve(params);

    if (session.schoolId !== schoolId && session.role !== "SUPER_ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    // Check for permissions
    if (session.role === "TEACHER") {
        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.user.id },
            include: { subjects: true }
        });

        if (!teacher) {
             return new NextResponse("Teacher profile not found", { status: 403 });
        }

        const allowedSubjectIds = new Set(teacher.subjects.map(s => s.subjectId));

        // Check each result
        for (const entry of body.results) {
            if (!allowedSubjectIds.has(entry.subjectId)) {
                 return new NextResponse(`Unauthorized: You are not assigned to subject ID ${entry.subjectId}`, { status: 403 });
            }
        }
    }

    const json = await req.json();
    const body = batchResultSchema.parse(json);

    // Fetch grading scale for calculation
    // We assume one grading scale for the school for simplicity, or we fetch matching one
    // Ideally we should find the grading scale based on the total score.
    const gradingScales = await prisma.gradingScale.findMany({
        where: {
            resultConfiguration: {
                schoolId,
                // We should match the active configuration. 
                // Since there is no direct link from Result to Configuration, we must infer or pick default.
                // We pick the one associated with the session if possible.
            }
        },
        orderBy: {
            minScore: 'desc'
        }
    });

    const resultsToUpdate = body.results;
    
    // Process in transaction or parallel
    // Since we need to delete/create component scores, transaction is better.
    // However, Prisma transaction for mixed logic is complex.
    // We will loop and await.
    
    const processedResults = [];

    for (const entry of resultsToUpdate) {
        const { studentId, subjectId, sessionId, periodId, componentScores } = entry;
        
        // Calculate total
        const totalScore = componentScores.reduce((sum, c) => sum + c.score, 0);
        
        // Determine grade
        let grade = "F";
        let remark = "Fail";
        
        for (const scale of gradingScales) {
            if (totalScore >= scale.minScore && totalScore <= scale.maxScore) {
                grade = scale.grade;
                remark = scale.remark;
                break;
            }
        }

        // Upsert Result
        // We use findFirst to get ID if it exists, because composite unique key might not be set in schema
        // Schema checks: @@unique([studentId, subjectId, sessionId, periodId])?
        // Let's check schema lines 48-60 (Step 1369).
        // It didn't show unique constraints.
        // If no unique constraint, ensure we don't create duplicates.
        
        const existingResult = await prisma.result.findFirst({
            where: { studentId, subjectId, sessionId, periodId }
        });

        let resultId = existingResult?.id;

        if (existingResult) {
            await prisma.result.update({
                where: { id: existingResult.id },
                data: {
                    total: totalScore,
                    grade,
                    remark,
                    // updatedBy: session.user.id // If schema supports
                }
            });
        } else {
            const newResult = await prisma.result.create({
                data: {
                    studentId,
                    subjectId,
                    sessionId,
                    periodId,
                    total: totalScore,
                    grade,
                    remark,
                    // createdBy: session.user.id
                }
            });
            resultId = newResult.id;
        }

        // Handle Component Scores
        // Delete existing and insert new
        if (resultId) {
            await prisma.componentScore.deleteMany({
                where: { resultId }
            });

            if (componentScores.length > 0) {
                await prisma.componentScore.createMany({
                    data: componentScores.map(cs => ({
                        resultId: resultId!, // assert non-null
                        assessmentComponentId: cs.componentId,
                        score: cs.score
                    }))
                });
            }
        }
        
        processedResults.push(resultId);
    }

    return NextResponse.json({ success: true, count: processedResults.length });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 });
    }
    console.error("[RESULTS_BATCH_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
