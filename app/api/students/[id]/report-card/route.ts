import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-client';
import PDFDocument from 'pdfkit';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getSession(null);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const studentId = params.id;
        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('sessionId');
        const periodId = searchParams.get('periodId');

        if (!sessionId || !periodId) {
            return NextResponse.json({ error: 'Session and Period are required' }, { status: 400 });
        }

        // Verify access - user must be the student or parent of the student
        const hasAccess = await verifyResultAccess(session.id, studentId);
        if (!hasAccess) {
            return NextResponse.json({ error: 'Unauthorized access to results' }, { status: 403 });
        }

        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: { user: true, school: true }
        });

        if (!student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Fetch results with components
        const results = await prisma.result.findMany({
            where: {
                studentId,
                sessionId,
                periodId,
                published: true,
            },
            include: {
                subject: true,
                componentScores: {
                    include: { component: true }
                },
                period: true,
                session: true,
            }
        });

        if (results.length === 0) {
            return NextResponse.json({ error: 'No published results found' }, { status: 404 });
        }

        const school = await prisma.school.findUnique({
            where: { id: student.schoolId! }
        });

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });
        const chunks: any[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));

        return new Promise((resolve) => {
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                resolve(new NextResponse(pdfBuffer, {
                    headers: {
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': `attachment; filename="Report_Card_${student.user.name.replace(/\s+/g, '_')}.pdf"`,
                    }
                }));
            });

            // Layout
            const primaryColor = school?.primaryColor || '#22c55e';

            // Header
            doc.fillColor(primaryColor).fontSize(20).text(school?.name || 'School Report Card', { align: 'center' });
            doc.fontSize(10).fillColor('#666666').text(school?.address || '', { align: 'center' });
            doc.moveDown();

            doc.fillColor('#000000').fontSize(14).text('OFFICIAL REPORT CARD', { align: 'center', underline: true });
            doc.moveDown();

            // Student Info
            doc.fontSize(12).text(`Student Name: ${student.user.name}`);
            doc.text(`Academic Session: ${results[0].session.name}`);
            doc.text(`Term/Period: ${results[0].period.name}`);
            doc.moveDown();

            // Table Header
            const startX = 50;
            let currentY = doc.y;
            doc.fillColor('#f3f4f6').rect(startX, currentY, 500, 20).fill();
            doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold');
            doc.text('Subject', startX + 5, currentY + 5);
            doc.text('Score', startX + 250, currentY + 5);
            doc.text('Grade', startX + 350, currentY + 5);
            doc.text('Remark', startX + 420, currentY + 5);

            currentY += 25;
            doc.font('Helvetica');

            // Table Body
            results.forEach((result) => {
                if (currentY > 700) {
                    doc.addPage();
                    currentY = 50;
                }
                doc.text(result.subject.name, startX + 5, currentY);
                doc.text(result.total.toString(), startX + 250, currentY);
                doc.text(result.grade, startX + 350, currentY);
                doc.text(result.remark, startX + 420, currentY);

                doc.moveTo(startX, currentY + 15).lineTo(startX + 500, currentY + 15).strokeColor('#e5e7eb').stroke();
                currentY += 25;
            });

            doc.moveDown();
            doc.fontSize(12).font('Helvetica-Bold').text(`Overall Performance`, { underline: true });
            const totalScore = results.reduce((sum, r) => sum + r.total, 0);
            const average = (totalScore / results.length).toFixed(2);
            doc.font('Helvetica').text(`Average Score: ${average}%`);

            doc.moveDown(2);
            doc.text('__________________________', 50, doc.y);
            doc.text('Principal Signature', 50, doc.y + 15);

            doc.text('__________________________', 350, doc.y - 15);
            doc.text('Date', 350, doc.y + 15);

            doc.end();
        });

    } catch (error) {
        console.error('Error generating report card:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

async function verifyResultAccess(
    userId: string,
    studentId: string
): Promise<boolean> {
    const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { userId: true },
    });

    if (student?.userId === userId) {
        return true;
    }

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
