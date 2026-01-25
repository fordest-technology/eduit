import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();

        if (!session || (session.role !== 'SCHOOL_ADMIN' && session.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { sessionId, periodId, classId } = await req.json();

        if (!sessionId || !periodId) {
            return NextResponse.json(
                { error: 'Session ID and Period ID are required' },
                { status: 400 }
            );
        }

        // Build where clause
        const where: any = {
            sessionId,
            periodId,
            published: false, // Only publish unpublished results
        };

        // If classId provided, filter by class
        if (classId) {
            where.student = {
                classes: {
                    some: {
                        classId,
                        sessionId,
                        status: 'ACTIVE',
                    },
                },
            };
        }

        // Count results to be published
        const count = await prisma.result.count({ where });

        if (count === 0) {
            return NextResponse.json(
                { error: 'No unpublished results found for the selected criteria' },
                { status: 400 }
            );
        }

        // Update results to published
        const updated = await prisma.result.updateMany({
            where,
            data: {
                published: true,
                publishedAt: new Date(),
                publishedById: session.id,
            },
        });

        // Create publication record
        const publication = await prisma.resultPublication.create({
            data: {
                schoolId: session.schoolId!,
                sessionId,
                periodId,
                classId: classId || null,
                publishedById: session.id,
                totalStudents: count,
                notificationsSent: false,
            },
        });

        // Send notifications in background (using a separate function for better structure)
        sendResultNotifications(publication.id).catch(err =>
            console.error('Failed to send result notifications:', err)
        );

        return NextResponse.json({
            success: true,
            message: `Successfully published results for ${count} students`,
            publication,
        });
    } catch (error) {
        console.error('Error publishing results:', error);
        return NextResponse.json(
            { error: 'Failed to publish results' },
            { status: 500 }
        );
    }
}

async function sendResultNotifications(publicationId: string) {
    try {
        const publication = await prisma.resultPublication.findUnique({
            where: { id: publicationId },
            include: {
                school: true,
                session: true,
                period: true,
            }
        });

        if (!publication) return;

        // Get all students affected by this publication
        const where: any = {
            sessionId: publication.sessionId,
            periodId: publication.periodId,
            published: true,
        };

        if (publication.classId) {
            where.student = {
                classes: {
                    some: {
                        classId: publication.classId,
                        sessionId: publication.sessionId,
                        status: 'ACTIVE',
                    },
                },
            };
        }

        const uniqueStudentIds = await prisma.result.findMany({
            where,
            select: { studentId: true },
            distinct: ['studentId'],
        });

        const studentIds = uniqueStudentIds.map(r => r.studentId);

        // Fetch student and parent details
        const students = await prisma.student.findMany({
            where: { id: { in: studentIds } },
            include: {
                user: { select: { name: true, email: true } },
                parents: {
                    include: {
                        parent: {
                            include: {
                                user: { select: { name: true, email: true } }
                            }
                        }
                    }
                }
            }
        });

        const { sendResultPublishedEmail } = await import('@/lib/email');

        for (const student of students) {
            const studentEmail = student.user.email;
            if (!studentEmail) continue;

            const primaryParent = student.parents.find(p => p.isPrimary) || student.parents[0];
            const parentEmail = primaryParent?.parent.user.email;
            const parentName = primaryParent?.parent.user.name;

            await sendResultPublishedEmail({
                studentName: student.user.name,
                studentEmail,
                parentName,
                parentEmail,
                periodName: publication.period.name,
                sessionName: publication.session.name,
                schoolName: publication.school.name,
                schoolId: publication.schoolId,
            });
        }

        // Mark notifications as sent
        await prisma.resultPublication.update({
            where: { id: publicationId },
            data: { notificationsSent: true },
        });

    } catch (error) {
        console.error('Error in sendResultNotifications:', error);
    }
}

// Unpublish results (admin only)
export async function DELETE(req: NextRequest) {
    try {
        const session = await getSession();

        if (!session || (session.role !== 'SCHOOL_ADMIN' && session.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('sessionId');
        const periodId = searchParams.get('periodId');
        const classId = searchParams.get('classId');

        if (!sessionId || !periodId) {
            return NextResponse.json(
                { error: 'Session ID and Period ID are required' },
                { status: 400 }
            );
        }

        // Build where clause
        const where: any = {
            sessionId,
            periodId,
            published: true,
        };

        if (classId) {
            where.student = {
                classes: {
                    some: {
                        classId,
                        sessionId,
                        status: 'ACTIVE',
                    },
                },
            };
        }

        // Unpublish results
        const updated = await prisma.result.updateMany({
            where,
            data: {
                published: false,
                publishedAt: null,
                publishedById: null,
            },
        });

        return NextResponse.json({
            success: true,
            message: `Successfully unpublished ${updated.count} results`,
        });
    } catch (error) {
        console.error('Error unpublishing results:', error);
        return NextResponse.json(
            { error: 'Failed to unpublish results' },
            { status: 500 }
        );
    }
}
