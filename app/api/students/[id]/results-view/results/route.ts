import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-client';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession(null);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('sessionId');
        const periodId = searchParams.get('periodId');

        // Verify access - user must be the student or parent of the student
        const hasAccess = await verifyResultAccess(
            session.id,
            params.id
        );

        if (!hasAccess) {
            return NextResponse.json(
                { error: 'You do not have permission to view these results' },
                { status: 403 }
            );
        }

        // Build query filters
        const where: any = {
            studentId: params.id,
            published: true, // Only show published results
        };

        if (sessionId) {
            where.sessionId = sessionId;
        }

        if (periodId) {
            where.periodId = periodId;
        }

        // Fetch results
        const results = await prisma.result.findMany({
            where,
            include: {
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
                    },
                },
                session: {
                    select: {
                        id: true,
                        name: true,
                        isCurrent: true,
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
            },
            orderBy: [
                { session: { startDate: 'desc' } },
                { period: { createdAt: 'desc' } },
                { subject: { name: 'asc' } },
            ],
        });

        // Calculate additional metrics if results exist
        if (results.length > 0 && sessionId && periodId) {
            const metrics = await calculateStudentMetrics(
                params.id,
                sessionId,
                periodId
            );

            return NextResponse.json({
                results,
                metrics,
            });
        }

        return NextResponse.json({ results });
    } catch (error) {
        console.error('Error fetching student results:', error);
        return NextResponse.json(
            { error: 'Failed to fetch results' },
            { status: 500 }
        );
    }
}

async function verifyResultAccess(
    userId: string,
    studentId: string
): Promise<boolean> {
    // Check if user is the student
    const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { userId: true },
    });

    if (student?.userId === userId) {
        return true;
    }

    // Check if user is a parent of the student
    const parentRelation = await prisma.studentParent.findFirst({
        where: {
            studentId,
            parent: {
                userId,
            },
        },
    });

    return !!parentRelation;
}

async function calculateStudentMetrics(
    studentId: string,
    sessionId: string,
    periodId: string
) {
    // Get all results for this student in this period
    const results = await prisma.result.findMany({
        where: {
            studentId,
            sessionId,
            periodId,
            published: true,
        },
        select: {
            total: true,
            grade: true,
        },
    });

    if (results.length === 0) {
        return null;
    }

    // Calculate average
    const totalScore = results.reduce((sum, r) => sum + r.total, 0);
    const average = totalScore / results.length;

    // Get student's class to calculate position
    const studentClass = await prisma.studentClass.findFirst({
        where: {
            studentId,
            sessionId,
            status: 'ACTIVE',
        },
        select: {
            classId: true,
        },
    });

    let position = null;
    let totalStudents = null;
    let classAverage = null;

    if (studentClass) {
        // Get all students in the same class
        const classStudents = await prisma.studentClass.findMany({
            where: {
                classId: studentClass.classId,
                sessionId,
                status: 'ACTIVE',
            },
            select: {
                studentId: true,
            },
        });

        // Calculate average for each student
        const studentAverages = await Promise.all(
            classStudents.map(async (cs) => {
                const studentResults = await prisma.result.findMany({
                    where: {
                        studentId: cs.studentId,
                        sessionId,
                        periodId,
                        published: true,
                    },
                    select: {
                        total: true,
                    },
                });

                if (studentResults.length === 0) return { studentId: cs.studentId, average: 0 };

                const total = studentResults.reduce((sum, r) => sum + r.total, 0);
                return {
                    studentId: cs.studentId,
                    average: total / studentResults.length,
                };
            })
        );

        // Sort by average descending
        studentAverages.sort((a, b) => b.average - a.average);

        // Find position
        position = studentAverages.findIndex((s) => s.studentId === studentId) + 1;
        totalStudents = studentAverages.length;

        // Calculate class average
        const classTotal = studentAverages.reduce((sum, s) => sum + s.average, 0);
        classAverage = classTotal / studentAverages.length;
    }

    return {
        average: parseFloat(average.toFixed(2)),
        totalSubjects: results.length,
        position,
        totalStudents,
        classAverage: classAverage ? parseFloat(classAverage.toFixed(2)) : null,
    };
}
