import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-client';

export async function POST(req: NextRequest) {
    try {
        const session = await getSession(null);

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

        // TODO: Send notifications in background
        // await sendResultNotifications(publication.id);

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

// Unpublish results (admin only)
export async function DELETE(req: NextRequest) {
    try {
        const session = await getSession(null);

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
