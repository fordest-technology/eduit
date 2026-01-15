import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const ResultEntrySchema = z.object({
    studentId: z.string(),
    subjectId: z.string(),
    sessionId: z.string(),
    periodId: z.string(),
    componentScores: z.record(z.number()),
    total: z.number(),
    teacherComment: z.string().optional(),
});

const BulkResultSchema = z.object({
    results: z.array(ResultEntrySchema),
});

/**
 * POST - Submit results for students
 * Teachers can submit individual or bulk results
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session || session.role !== "TEACHER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { results } = BulkResultSchema.parse(body);

        // Get teacher record
        const teacher = await prisma.teacher.findUnique({
            where: { userId: session.id },
        });

        if (!teacher) {
            return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
        }

        // Verify teacher is authorized to enter results for these subjects
        const subjectIds = [...new Set(results.map((r) => r.subjectId))];
        const teacherSubjects = await prisma.subjectTeacher.findMany({
            where: {
                teacherId: teacher.id,
                subjectId: { in: subjectIds },
            },
        });

        if (teacherSubjects.length !== subjectIds.length) {
            return NextResponse.json(
                { error: "Not authorized to teach one or more subjects" },
                { status: 403 }
            );
        }

        // Get grading scale for calculation
        const resultConfig = await prisma.resultConfiguration.findFirst({
            where: {
                sessionId: results[0].sessionId,
            },
            include: {
                gradingScale: {
                    orderBy: { minScore: "desc" },
                },
                assessmentComponents: true,
            },
        });

        if (!resultConfig) {
            return NextResponse.json(
                { error: "Result configuration not found" },
                { status: 404 }
            );
        }

        // Function to calculate grade and remark
        const calculateGradeAndRemark = (score: number) => {
            const gradeEntry = resultConfig.gradingScale.find(
                (g) => score >= g.minScore && score <= g.maxScore
            );

            return {
                grade: gradeEntry?.grade || "F",
                remark: gradeEntry?.remark || "Fail",
            };
        };

        // Process results in a transaction
        const savedResults = await prisma.$transaction(
            results.map((resultData) => {
                const { grade, remark } = calculateGradeAndRemark(resultData.total);

                return prisma.result.upsert({
                    where: {
                        studentId_subjectId_periodId_sessionId: {
                            studentId: resultData.studentId,
                            subjectId: resultData.subjectId,
                            periodId: resultData.periodId,
                            sessionId: resultData.sessionId,
                        },
                    },
                    update: {
                        total: resultData.total,
                        grade,
                        remark,
                        teacherComment: resultData.teacherComment,
                        componentScores: {
                            deleteMany: {},
                            create: Object.entries(resultData.componentScores).map(
                                ([componentId, score]) => ({
                                    componentId,
                                    score,
                                })
                            ),
                        },
                    },
                    create: {
                        studentId: resultData.studentId,
                        subjectId: resultData.subjectId,
                        sessionId: resultData.sessionId,
                        periodId: resultData.periodId,
                        total: resultData.total,
                        grade,
                        remark,
                        teacherComment: resultData.teacherComment,
                        componentScores: {
                            create: Object.entries(resultData.componentScores).map(
                                ([componentId, score]) => ({
                                    componentId,
                                    score,
                                })
                            ),
                        },
                    },
                });
            })
        );

        return NextResponse.json({
            success: true,
            count: savedResults.length,
            message: `Successfully saved ${savedResults.length} result(s)`,
        });
    } catch (error) {
        console.error("Error saving results:", error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid data format", details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Failed to save results" },
            { status: 500 }
        );
    }
}

/**
 * GET - Fetch existing results for a class/subject/period
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session || session.role !== "TEACHER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const classId = searchParams.get("classId");
        const subjectId = searchParams.get("subjectId");
        const periodId = searchParams.get("periodId");
        const sessionId = searchParams.get("sessionId");

        if (!classId || !subjectId || !periodId || !sessionId) {
            return NextResponse.json(
                { error: "Missing required parameters" },
                { status: 400 }
            );
        }

        // Get all students in the class
        const students = await prisma.studentClass.findMany({
            where: {
                classId,
                sessionId,
                status: "ACTIVE",
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: { name: true, email: true },
                        },
                    },
                },
            },
            orderBy: {
                student: {
                    user: {
                        name: "asc",
                    },
                },
            },
        });

        // Get existing results
        const results = await prisma.result.findMany({
            where: {
                studentId: { in: students.map((s) => s.studentId) },
                subjectId,
                periodId,
                sessionId,
            },
            include: {
                componentScores: {
                    include: {
                        component: true,
                    },
                },
            },
        });

        // Get result configuration
        const resultConfig = await prisma.resultConfiguration.findFirst({
            where: { sessionId },
            include: {
                assessmentComponents: {
                    orderBy: { createdAt: "asc" },
                },
                gradingScale: {
                    orderBy: { minScore: "desc" },
                },
            },
        });

        // Combine student data with results
        const studentsWithResults = students.map((studentClass) => {
            const result = results.find((r) => r.studentId === studentClass.studentId);

            const componentScores: Record<string, number> = {};
            if (result) {
                result.componentScores.forEach((cs) => {
                    componentScores[cs.componentId] = cs.score;
                });
            }

            return {
                studentId: studentClass.studentId,
                name: studentClass.student.user.name,
                email: studentClass.student.user.email,
                rollNumber: studentClass.rollNumber,
                resultId: result?.id,
                total: result?.total || 0,
                grade: result?.grade,
                remark: result?.remark,
                teacherComment: result?.teacherComment,
                componentScores,
                hasResult: !!result,
            };
        });

        return NextResponse.json({
            students: studentsWithResults,
            components: resultConfig?.assessmentComponents || [],
            gradingScale: resultConfig?.gradingScale || [],
        });
    } catch (error) {
        console.error("Error fetching results:", error);
        return NextResponse.json(
            { error: "Failed to fetch results" },
            { status: 500 }
        );
    }
}
