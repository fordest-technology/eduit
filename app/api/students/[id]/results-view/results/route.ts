import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: studentId } = await params;
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('sessionId');
        const periodId = searchParams.get('periodId');

        // Fetch student for access verification
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            select: { id: true, userId: true, schoolId: true }
        });

        if (!student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Verify access - user must be student, parent, or school staff
        const hasAccess = await verifyResultAccess(session, student);

        if (!hasAccess) {
            return NextResponse.json(
                { error: 'You do not have permission to view these results' },
                { status: 403 }
            );
        }

        // Build query filters
        const where: any = {
            studentId: studentId,
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
                studentId,
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
    session: any,
    student: any
): Promise<boolean> {
    const { id: userId, role, schoolId: userSchoolId } = session;
    const studentId = student.id;

    // 1. Super Admin access
    if (role === UserRole.SUPER_ADMIN) return true;

    // 2. School Admin access (same school)
    if (role === UserRole.SCHOOL_ADMIN && userSchoolId === student.schoolId) return true;

    // 3. Teacher access (same school)
    if (role === UserRole.TEACHER && userSchoolId === student.schoolId) return true;

    // 4. Student access (own results)
    if (role === UserRole.STUDENT && student.userId === userId) return true;

    // 5. Parent access (if linked)
    if (role === UserRole.PARENT) {
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

    return false;
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
