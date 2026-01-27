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
        user: {
          schoolId,
        },
        classes: classId ? {
          some: {
            classId,
            sessionId,
            status: "ACTIVE"
          }
        } : undefined
      }
    };

    if (subjectId && subjectId !== 'all') {
      where.subjectId = subjectId;
    }

    const results = await prisma.result.findMany({
      where,
      include: {
        componentScores: {
          include: {
            component: true
          }
        },
        student: {
          select: {
            id: true,
            user: {
              select: {
                name: true
              }
            }
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
    teacherComment: z.string().optional(),
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
    
    const json = await req.json();
    const body = batchResultSchema.parse(json);
    
    // Check for permissions
    if (session.role === "TEACHER") {
        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.id },
            include: { 
              subjects: true,
              classes: true 
            }
        });

        if (!teacher) {
             return new NextResponse("Teacher profile not found", { status: 403 });
        }

        const allowedSubjectIds = new Set(teacher.subjects.map(s => s.subjectId));
        const formClassIds = new Set(teacher.classes.map(c => c.id));

        // Check each result
        for (const entry of body.results) {
             // 1. Check if allowed subject
             const isSubjectAllowed = allowedSubjectIds.has(entry.subjectId);
             
             // 2. Check if form teacher for the class
             // If classId is not provided in entry, we can't verify form teacher status easily here,
             // but UI sends it. If not sent, we assume strict subject check or fail.
             // Given schema optional classId, if missing, isFormTeacher is false.
             const isFormTeacher = entry.classId && formClassIds.has(entry.classId);

            if (!isSubjectAllowed && !isFormTeacher) {
                 return new NextResponse(`Unauthorized: You are not assigned to subject ID ${entry.subjectId} and are not the form teacher.`, { status: 403 });
            }
        }
    }

    // Fetch grading scale for calculation
    // We assume one grading scale for the school for simplicity, or we fetch matching one
    // Ideally we should find the grading scale based on the total score.
    const gradingScales = await prisma.gradingScale.findMany({
        where: {
            configuration: {
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
        const { studentId, subjectId, sessionId, periodId, componentScores, teacherComment } = entry;
        
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
                    teacherComment: teacherComment, // Update comment
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
                    teacherComment: teacherComment, // Save comment
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
                        componentId: cs.componentId,
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
