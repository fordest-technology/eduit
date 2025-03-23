import { NextResponse, NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { Readable } from "stream";
import { Prisma } from "@prisma/client";

type ExtendedStudent = Prisma.StudentGetPayload<{
  include: {
    results: {
      include: {
        subject: true;
      };
    };
  };
}>;

type ExtendedClass = Prisma.ClassGetPayload<{
  include: {
    school: true;
    teacher: {
      select: {
        id: true;
        name: true;
      };
    };
    students: {
      include: {
        student: {
          include: {
            results: {
              include: {
                subject: true;
              };
            };
          };
        };
      };
    };
  };
}>;

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated || !auth.authorized) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { classId, sessionId, examType, settings, template, format } =
      await request.json();

    // Verify user has permission to access this class's results
    const userRole = auth.user.role;
    const userId = auth.user.id;

    let hasAccess = false;
    if (userRole === "school_admin" || userRole === "super_admin") {
      hasAccess = true;
    } else if (userRole === "teacher") {
      // Check if teacher is class teacher or subject teacher
      const teacherClass = await prisma.class.findFirst({
        where: {
          id: classId,
          teacherId: userId,
        },
      });

      const teacherSubjects = await prisma.subjectTeacher.findMany({
        where: {
          teacherId: userId,
          classSubject: {
            classId: classId,
          },
        },
      });

      hasAccess = Boolean(teacherClass || teacherSubjects.length > 0);
    }

    if (!hasAccess) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Fetch all required data
    const classData = (await prisma.class.findUnique({
      where: { id: classId },
      include: {
        school: true,
        teacher: true,
        students: {
          include: {
            student: {
              include: {
                results: {
                  where: {
                    sessionId,
                    examType,
                  },
                  include: {
                    subject: true,
                  },
                },
              },
            },
          },
        },
      },
    })) as ExtendedClass | null;

    if (!classData) {
      return new NextResponse("Class not found", { status: 404 });
    }

    // Generate report based on format
    if (format === "pdf") {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      // Collect PDF chunks
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));

      // PDF Generation Logic
      if (settings.showLogo && classData.school.logoUrl) {
        doc.image(classData.school.logoUrl, 50, 50, { width: 100 });
      }

      if (settings.showSchoolInfo) {
        doc.fontSize(20).text(classData.school.name, { align: "center" });
        doc
          .fontSize(12)
          .text(classData.school.address || "", { align: "center" });
        doc.moveDown();
      }

      doc.fontSize(16).text(`${examType} Result Report - ${classData.name}`, {
        align: "center",
      });
      doc.moveDown();

      // Generate table for each student
      classData.students.forEach((studentClass) => {
        const student = studentClass.student;
        doc.fontSize(14).text(`Student: ${student.name}`);

        // Create result table
        const startY = doc.y;
        let currentY = startY;

        // Headers
        doc.fontSize(10);
        const columns = [
          { x: 50, width: 200, title: "Subject" },
          { x: 250, width: 50, title: "Score" },
          { x: 300, width: 50, title: "Total" },
          { x: 350, width: 50, title: "Grade" },
        ];

        if (settings.showPosition) {
          columns.push({ x: 400, width: 50, title: "Pos" });
        }

        // Draw headers
        columns.forEach((col) => {
          doc.text(col.title, col.x, currentY);
        });
        currentY += 20;

        // Draw results
        student.results.forEach((result) => {
          doc.text(result.subject.name, 50, currentY);
          doc.text(result.marks.toString(), 250, currentY);
          doc.text(result.totalMarks.toString(), 300, currentY);
          doc.text(result.grade || "-", 350, currentY);
          if (settings.showPosition) {
            doc.text(result.position?.toString() || "-", 400, currentY);
          }
          currentY += 20;
        });

        // Additional information
        if (
          settings.showAttendance ||
          settings.showBehavior ||
          settings.showEffort
        ) {
          doc.moveDown();
          doc.fontSize(12).text("Additional Information:");

          if (settings.showAttendance) {
            const avgAttendance =
              student.results.reduce(
                (sum: number, r) => sum + (r.attendance || 0),
                0
              ) / student.results.length;
            doc.text(`Attendance: ${avgAttendance.toFixed(1)}%`);
          }

          if (settings.showBehavior) {
            const avgBehavior =
              student.results.reduce(
                (sum: number, r) => sum + (r.behavior || 0),
                0
              ) / student.results.length;
            doc.text(`Behavior: ${avgBehavior.toFixed(1)}/5`);
          }

          if (settings.showEffort) {
            const avgEffort =
              student.results.reduce(
                (sum: number, r) => sum + (r.effort || 0),
                0
              ) / student.results.length;
            doc.text(`Effort: ${avgEffort.toFixed(1)}/5`);
          }
        }

        // Teacher notes
        if (settings.showTeacherNotes) {
          doc.moveDown();
          doc.fontSize(12).text("Teacher Notes:");
          student.results.forEach((result) => {
            if (result.teacherNote) {
              doc
                .fontSize(10)
                .text(`${result.subject.name}: ${result.teacherNote}`);
            }
          });
        }

        // Signature fields
        if (settings.signatureFields.length > 0) {
          doc.moveDown(2);
          const signatureWidth = 500 / settings.signatureFields.length;
          settings.signatureFields.forEach((field, index) => {
            doc
              .fontSize(10)
              .text("_".repeat(30), 50 + index * signatureWidth, doc.y)
              .text(field, 50 + index * signatureWidth, doc.y + 5);
          });
        }

        // Add page break between students
        if (
          studentClass !== classData.students[classData.students.length - 1]
        ) {
          doc.addPage();
        }
      });

      // Finalize PDF
      doc.end();

      // Convert chunks to buffer
      const pdfBuffer = Buffer.concat(chunks);

      // Return PDF
      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=result_report_${classId}_${examType}.pdf`,
        },
      });
    } else if (format === "excel") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Results");

      // Add headers
      const headers = ["Student Name", "Subject", "Score", "Total", "Grade"];
      if (settings.showPosition) headers.push("Position");
      if (settings.showAttendance) headers.push("Attendance");
      if (settings.showBehavior) headers.push("Behavior");
      if (settings.showEffort) headers.push("Effort");
      if (settings.showTeacherNotes) headers.push("Teacher Notes");

      worksheet.addRow(headers);

      // Add data
      classData.students.forEach((studentClass) => {
        const student = studentClass.student;
        student.results.forEach((result) => {
          const row = [
            student.name,
            result.subject.name,
            result.marks,
            result.totalMarks,
            result.grade || "-",
          ];

          if (settings.showPosition)
            row.push(result.position?.toString() || "-");
          if (settings.showAttendance)
            row.push(result.attendance?.toString() || "-");
          if (settings.showBehavior)
            row.push(result.behavior?.toString() || "-");
          if (settings.showEffort) row.push(result.effort?.toString() || "-");
          if (settings.showTeacherNotes) row.push(result.teacherNote || "-");

          worksheet.addRow(row);
        });
      });

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();

      // Return Excel file
      return new NextResponse(buffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename=result_report_${classId}_${examType}.xlsx`,
        },
      });
    }

    return new NextResponse("Invalid format specified", { status: 400 });
  } catch (error) {
    console.error("Error generating report:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

function formatField(field: string | number | null, index: number): string {
  if (field === null) return "";
  return String(field);
}
