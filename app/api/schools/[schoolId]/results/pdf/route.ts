import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import PDFDocument from "pdfkit";

// POST handler to generate PDF for student result
export async function POST(
  request: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { schoolId } = await params;
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to this school
    if (session.role !== "SUPER_ADMIN" && session.schoolId !== schoolId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { studentId, periodId, sessionId, resultData } = body;

    if (!studentId || !periodId || !sessionId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Fetch school branding for PDF
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        name: true,
        logo: true,
        address: true,
        phone: true,
        email: true,
        primaryColor: true,
        secondaryColor: true,
      },
    });

    // Fetch grading scale for the school
    const config = await prisma.resultConfiguration.findFirst({
      where: { schoolId },
      include: {
        gradingScale: true,
      },
    });

    const data = {
      ...resultData,
      school,
      gradingScale: config?.gradingScale || [],
    };

    // Generate PDF using PDFKit
    const pdfBuffer = await generatePDF(data);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="result-${resultData?.student?.name || 'student'}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

async function generatePDF(data: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const {
        student,
        class: studentClass,
        school,
        session,
        period,
        results,
        summary,
        gradingScale,
      } = data;

      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks: any[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      const primaryColor = school?.primaryColor || "#f97316";

      // Header
      doc.rect(0, 0, doc.page.width, 140)
         .fill(primaryColor);

      doc.fillColor("#ffffff")
         .fontSize(24)
         .font("Helvetica-Bold")
         .text(school?.name || "SCHOOL REPORT CARD", 0, 40, { align: "center" });

      doc.fontSize(10)
         .font("Helvetica")
         .text(school?.address || "", 0, 75, { align: "center" });
      
      if (school?.phone || school?.email) {
          doc.text(`${school?.phone ? `Tel: ${school.phone}` : ""} ${school?.email ? ` | Email: ${school.email}` : ""}`, 0, 90, { align: "center" });
      }

      // Title Box
      doc.rect(50, 120, doc.page.width - 100, 30)
         .fill("#1e293b");
      
      doc.fillColor("#ffffff")
         .fontSize(12)
         .font("Helvetica-Bold")
         .text(`STUDENT ACADEMIC REPORT - ${period?.name?.toUpperCase() || 'TERM'} ${session?.name || ''}`, 50, 130, { align: "center" });

      // Student Info Section
      doc.fillColor("#1e293b")
         .fontSize(10)
         .font("Helvetica");

      let y = 170;
      const col1 = 60;
      const col2 = 300;

      // Draw gray background for info
      doc.rect(50, 160, doc.page.width - 100, 60)
         .fill("#f8fafc");
      
      doc.fillColor("#64748b").font("Helvetica-Bold").text("Name:", col1, y);
      doc.fillColor("#1e293b").font("Helvetica").text(student?.name || "N/A", col1 + 50, y);

      doc.fillColor("#64748b").font("Helvetica-Bold").text("Class:", col2, y);
      doc.fillColor("#1e293b").font("Helvetica").text(`${studentClass?.name || "N/A"} ${studentClass?.section || ""}`, col2 + 50, y);

      y += 20;
      doc.fillColor("#64748b").font("Helvetica-Bold").text("Roll No:", col1, y);
      doc.fillColor("#1e293b").font("Helvetica").text(student?.rollNumber || "N/A", col1 + 50, y);

      doc.fillColor("#64748b").font("Helvetica-Bold").text("Session:", col2, y);
      doc.fillColor("#1e293b").font("Helvetica").text(session?.name || "N/A", col2 + 50, y);

      // Results Table Header
      y = 240;
      doc.rect(50, y, doc.page.width - 100, 25)
         .fill(primaryColor);
      
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
      doc.text("S/N", 60, y + 8);
      doc.text("SUBJECT", 90, y + 8);
      
      // Dynamic component columns
      const components = results?.[0]?.componentScores || [];
      let compX = 250;
      components.forEach((comp: any) => {
          doc.text(comp.name.toUpperCase(), compX, y + 8);
          compX += 40;
      });

      doc.text("TOTAL", 430, y + 8);
      doc.text("GRADE", 480, y + 8);
      doc.text("REMARK", 520, y + 8);

      // Results Table Rows
      y += 25;
      doc.fillColor("#1e293b").font("Helvetica").fontSize(9);
      
      results?.forEach((result: any, index: number) => {
          if (y > doc.page.height - 150) {
              doc.addPage();
              y = 50;
              // Redraw header if needed or just continue
          }

          if (index % 2 === 0) {
              doc.rect(50, y, doc.page.width - 100, 20).fill("#f8fafc");
          }
          
          doc.fillColor("#1e293b");
          doc.text((index + 1).toString(), 60, y + 6);
          doc.text(result.subject?.name || "N/A", 90, y + 6, { width: 150 });

          let rowCompX = 250;
          result.componentScores?.forEach((cs: any) => {
              doc.text((cs.score || 0).toString(), rowCompX, y + 6);
              rowCompX += 40;
          });

          doc.font("Helvetica-Bold").text((result.total || 0).toString(), 430, y + 6);
          doc.text(result.grade || "N/A", 480, y + 6);
          doc.font("Helvetica").text(result.remark || "N/A", 520, y + 6, { width: 40 });

          y += 20;
      });

      // Summary Section
      y += 20;
      doc.rect(50, y, doc.page.width - 100, 60).fill("#1e293b");
      
      const sumX = 70;
      doc.fillColor("#94a3b8").fontSize(8).text("TOTAL SCORE", sumX, y + 15);
      doc.fillColor("#ffffff").fontSize(14).font("Helvetica-Bold").text((summary?.totalScore || 0).toString(), sumX, y + 30);

      doc.fillColor("#94a3b8").fontSize(8).text("AVERAGE", sumX + 130, y + 15);
      doc.fillColor("#ffffff").fontSize(14).font("Helvetica-Bold").text(`${summary?.average || 0}%`, sumX + 130, y + 30);

      doc.fillColor("#94a3b8").fontSize(8).text("OVERALL GRADE", sumX + 260, y + 15);
      doc.fillColor("#ffffff").fontSize(14).font("Helvetica-Bold").text(summary?.overallGrade || "N/A", sumX + 260, y + 30);

      // Grading Scale
      y += 80;
      doc.fillColor("#64748b").fontSize(10).font("Helvetica-Bold").text("GRADING SCALE", 50, y);
      y += 15;
      
      let scaleX = 50;
      const scales = gradingScale?.length > 0 ? gradingScale : [
          { grade: "A", minScore: 70, maxScore: 100, remark: "Excellent" },
          { grade: "B", minScore: 60, maxScore: 69, remark: "Very Good" },
          { grade: "C", minScore: 50, maxScore: 59, remark: "Good" },
          { grade: "D", minScore: 40, maxScore: 49, remark: "Pass" },
          { grade: "F", minScore: 0, maxScore: 39, remark: "Fail" }
      ];

      scales.forEach((scale: any) => {
          doc.fontSize(8).font("Helvetica-Bold").fillColor(primaryColor).text(scale.grade, scaleX, y);
          doc.fillColor("#64748b").font("Helvetica").text(`${scale.minScore}-${scale.maxScore}%`, scaleX + 15, y);
          scaleX += 100;
          if (scaleX > 500) { scaleX = 50; y += 15; }
      });

      // Footer / Signatures
      y = doc.page.height - 100;
      doc.moveTo(50, y).lineTo(200, y).stroke();
      doc.fontSize(8).text("Class Teacher's Signature", 50, y + 5);

      doc.moveTo(doc.page.width - 200, y).lineTo(doc.page.width - 50, y).stroke();
      doc.fontSize(8).text("Principal's Signature", doc.page.width - 200, y + 5);

      doc.fontSize(7).fillColor("#94a3b8").text(`Generated on ${new Date().toLocaleDateString()} | This is a computer generated document.`, 0, doc.page.height - 40, { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
