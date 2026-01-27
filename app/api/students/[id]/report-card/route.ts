import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import PDFDocument from 'pdfkit';
import { UserRole } from '@prisma/client';
import { renderTemplateToPDF, RenderData } from '@/lib/pdf-renderer';
import { primarySchoolTemplate } from '@/lib/result-templates/default-templates';

/**
 * PDF generation for student report cards.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: studentId } = await params;
        const authData = await getSession();
        
        if (!authData) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const targetSessionId = searchParams.get('sessionId');
        const targetPeriodId = searchParams.get('periodId');

        if (!targetSessionId || !targetPeriodId) {
            return NextResponse.json({ error: 'Session and Period are required' }, { status: 400 });
        }

        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: { 
                user: {
                    include: { school: true }
                },
                classes: {
                    where: { sessionId: targetSessionId },
                    include: { class: { include: { level: true } } }
                }
            }
        });

        if (!student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        const hasAccess = await verifyResultAccess(authData, student);
        if (!hasAccess) {
            return NextResponse.json({ error: 'Unauthorized access to results' }, { status: 403 });
        }

        const publishedResults = await prisma.result.findMany({
            where: {
                studentId,
                sessionId: targetSessionId,
                periodId: targetPeriodId,
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

        if (publishedResults.length === 0) {
            return NextResponse.json({ error: 'No published results found' }, { status: 404 });
        }

        const currentSchool = student.user.school;
        const gradingRules = await prisma.gradingScale.findMany({ 
            where: { 
                configuration: {
                    schoolId: student.user.schoolId!,
                    sessionId: targetSessionId
                }
            } 
        });

        const enrolledClass = student.classes[0];
        const currentLevelId = enrolledClass?.class?.levelId;

        console.log(`[REPORT_GEN] Student: ${student.user.name}, Level: ${currentLevelId}, Target Period: ${targetPeriodId}`);

        // Hierarchical Selection Strategy:
        const findTemplate = async (criteria: { levelId?: string | null, periodId?: string | null, isDefault?: boolean }) => {
            const where: any = { schoolId: student.user.schoolId! };
            if (criteria.levelId !== undefined) where.levelId = criteria.levelId;
            if (criteria.periodId !== undefined) where.periodId = criteria.periodId;
            if (criteria.isDefault !== undefined) where.isDefault = criteria.isDefault;
            
            return await prisma.resultTemplate.findFirst({ where });
        };

        // Try matches in order of specificity
        let activeTemplate = await findTemplate({ levelId: currentLevelId, periodId: targetPeriodId });
        
        if (!activeTemplate && currentLevelId) {
            activeTemplate = await findTemplate({ levelId: currentLevelId });
        }
        
        if (!activeTemplate) {
            activeTemplate = await findTemplate({ periodId: targetPeriodId });
        }
        
        if (!activeTemplate) {
            activeTemplate = await findTemplate({ isDefault: true });
        }
        
        if (!activeTemplate) {
            activeTemplate = await findTemplate({});
        }

        if (activeTemplate) {
            console.log(`[REPORT_GEN] Selected Template: ${activeTemplate.name} (UUID: ${activeTemplate.id})`);
        } else {
            console.warn(`[REPORT_GEN] No template found for school ${student.user.schoolId}. Using hardcoded fallback.`);
        }

        const resultPeriod = publishedResults[0]?.period;
        const resultSession = publishedResults[0]?.session;

        const totalScoreValue = publishedResults.reduce((sum, r) => sum + r.total, 0);
        const averagePercent = (totalScoreValue / publishedResults.length).toFixed(1);
        
        const finalGrade = gradingRules.find(s => parseFloat(averagePercent) >= s.minScore && parseFloat(averagePercent) <= s.maxScore)?.grade || "N/A";

        // Calculate Position and Class Size
        const classStudents = await prisma.studentClass.findMany({
            where: {
                classId: enrolledClass.classId,
                sessionId: targetSessionId
            },
            select: { studentId: true }
        });
        const studentsInClass = classStudents.length;

        const allResults = await prisma.result.findMany({
            where: {
                studentId: { in: classStudents.map(s => s.studentId) },
                sessionId: targetSessionId,
                periodId: targetPeriodId,
                published: true
            },
            select: { studentId: true, total: true }
        });

        const studentAverages = new Map<string, number>();
        allResults.forEach(r => {
            const current = studentAverages.get(r.studentId) || { sum: 0, count: 0 };
            studentAverages.set(r.studentId, { 
                sum: current.sum + r.total, 
                count: current.count + 1 
            });
        });

        const averagesArray = Array.from(studentAverages.entries()).map(([sid, data]) => ({
            studentId: sid,
            average: data.sum / data.count
        }));

        averagesArray.sort((a, b) => b.average - a.average);

        const positionIndex = averagesArray.findIndex(a => a.studentId === studentId);
        const position = positionIndex !== -1 ? (positionIndex + 1).toString() : "N/A";

        // Cumulative Calculation
        const previousResults = await prisma.result.findMany({
            where: {
                studentId,
                sessionId: targetSessionId,
                periodId: { not: targetPeriodId },
                published: true
            },
            include: { period: true }
        });

        const prevTotal = previousResults.reduce((sum, r) => sum + r.total, 0);
        const uniquePrevPeriods = new Set(previousResults.map(r => r.periodId)).size;
        
        const cumulativeData = {
            previousTotal: prevTotal,
            termCount: uniquePrevPeriods + 1,
            average: ((prevTotal + totalScoreValue) / (previousResults.length + publishedResults.length)).toFixed(1)
        };

        const pdfRenderData: RenderData = {
            student,
            school: currentSchool,
            studentClass: enrolledClass,
            academicSession: resultSession,
            period: resultPeriod,
            results: publishedResults,
            gradingScale: gradingRules,
            summary: {
                totalScore: totalScoreValue,
                average: averagePercent,
                overallGrade: finalGrade,
                position,
                studentsInClass
            },
            cumulative: cumulativeData
        };

        // Detect orientation from template
        const templateContent = (activeTemplate?.content as any);
        const canvasSize = templateContent?.canvasSize || { width: 794, height: 1123 };
        const orientation = canvasSize.width > canvasSize.height ? 'landscape' : 'portrait';

        const doc = new PDFDocument({ size: "A4", margin: 0, layout: orientation });
        const pdfChunks: any[] = [];

        doc.on("data", (chunk) => pdfChunks.push(chunk));

        return new Promise(async (resolve) => {
            doc.on("end", () => {
                const finalBuffer = Buffer.concat(pdfChunks);
                const schoolName = currentSchool?.name.replace(/\s+/g, "_") || "School";
                const studentName = student.user.name.replace(/\s+/g, "_");
                
                resolve(new NextResponse(finalBuffer, {
                    headers: {
                        "Content-Type": "application/pdf",
                        "Content-Disposition": `attachment; filename="${schoolName}_${studentName}_Report.pdf"`,
                    }
                }));
            });

            if (activeTemplate) {
                try {
                    await renderTemplateToPDF(doc, activeTemplate, pdfRenderData);
                } catch (error) {
                    console.error("Template rendering error:", error);
                    renderGenericPDF(doc, pdfRenderData);
                }
            } else {
                await renderTemplateToPDF(doc, { content: primarySchoolTemplate }, pdfRenderData);
            }

            doc.end();
        });

    } catch (err) {
        console.error('Report generation error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

function renderGenericPDF(doc: any, data: RenderData) {
    const { school, student, results, summary } = data;
    const accentColor = school?.primaryColor || "#f97316";

    doc.rect(0, 0, doc.page.width, 140).fill(accentColor);

    doc.fillColor("#ffffff")
        .fontSize(24)
        .font("Helvetica-Bold")
        .text(school?.name || "SCHOOL REPORT CARD", 0, 40, { align: "center" });
    
    doc.fontSize(10)
        .font("Helvetica")
        .text(school?.address || "", 0, 75, { align: "center" });

    doc.rect(50, 160, doc.page.width - 100, 60).fill("#f8fafc");
    
    let currentY = 175;
    doc.fillColor("#64748b").fontSize(8).font("Helvetica-Bold").text("STUDENT", 70, currentY);
    doc.fillColor("#1e293b").fontSize(10).font("Helvetica").text(student.user.name, 70, currentY + 12);

    doc.fillColor("#64748b").fontSize(8).font("Helvetica-Bold").text("SESSION / TERM", 300, currentY);
    doc.fillColor("#1e293b").fontSize(10).font("Helvetica").text(`${data.academicSession?.name || 'N/A'} - ${data.period?.name || 'N/A'}`, 300, currentY + 12);

    currentY = 240;
    doc.rect(50, currentY, doc.page.width - 100, 25).fill(accentColor);
    
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
    doc.text("SUBJECT", 70, currentY + 8);
    
    const assessmentTypes = results[0]?.componentScores || [];
    let headerX = 250;
    assessmentTypes.forEach((at: any) => {
        doc.text(at.component.name.toUpperCase(), headerX, currentY + 8);
        headerX += 45;
    });

    doc.text("TOTAL", 440, currentY + 8);
    doc.text("GRADE", 490, currentY + 8);
    doc.text("REMARK", 535, currentY + 8);

    currentY += 25;
    results.forEach((r: any, idx: number) => {
        if (idx % 2 === 0) doc.rect(50, currentY, doc.page.width - 100, 22).fill("#f8fafc");
        
        doc.fillColor("#1e293b").font("Helvetica").fontSize(9);
        doc.text(r.subject.name, 70, currentY + 7);

        let rowX = 250;
        r.componentScores.forEach((cs: any) => {
            doc.text(cs.score.toString(), rowX, currentY + 7);
            rowX += 45;
        });

        doc.font("Helvetica-Bold").text(r.total.toString(), 440, currentY + 7);
        doc.text(r.grade, 490, currentY + 7);
        doc.font("Helvetica").fontSize(8).text(r.remark || "-", 535, currentY + 7, { width: 50 });

        currentY += 22;
    });

    currentY = doc.page.height - 180;
    doc.rect(50, currentY, doc.page.width - 100, 50).fill("#1e293b");
    
    doc.fillColor("#94a3b8").fontSize(8).font("Helvetica").text("AVERAGE", 70, currentY + 12);
    doc.fillColor("#ffffff").fontSize(16).font("Helvetica-Bold").text(`${summary.average}%`, 70, currentY + 25);

    doc.fillColor("#94a3b8").fontSize(8).font("Helvetica").text("GRADE", 200, currentY + 12);
    doc.fillColor("#ffffff").fontSize(16).font("Helvetica-Bold").text(summary.overallGrade, 200, currentY + 25);

    doc.fontSize(7).text(`EduIT Digital Report System`, 0, doc.page.height - 30, { align: "center" });
}

async function verifyResultAccess(
    context: any,
    student: any
): Promise<boolean> {
    const { id: currentUserId, role, schoolId: userSchoolId } = context;
    const studentId = student.id;
    const studentSchoolId = student.user?.schoolId;

    if (role === UserRole.SUPER_ADMIN) return true;
    if (role === UserRole.SCHOOL_ADMIN && userSchoolId === studentSchoolId) return true;
    if (role === UserRole.TEACHER && userSchoolId === studentSchoolId) return true;
    if (role === UserRole.STUDENT && student.userId === currentUserId) return true;

    if (role === UserRole.PARENT) {
        const link = await prisma.studentParent.findFirst({
            where: {
                studentId,
                parent: { userId: currentUserId },
            },
        });
        return !!link;
    }

    return false;
}
