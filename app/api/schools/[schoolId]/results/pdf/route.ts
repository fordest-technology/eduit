import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";

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

    // Generate HTML for PDF
    const htmlContent = generateResultHTML({
      ...resultData,
      school,
      gradingScale: config?.gradingScale || [],
    });

    // For now, return HTML that can be printed/saved as PDF by browser
    // In production, you would use a library like puppeteer or html-pdf
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="result-${resultData?.student?.name || 'student'}.html"`,
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

// Generate HTML template for result
function generateResultHTML(data: any) {
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

  const primaryColor = school?.primaryColor || "#f97316"; // Orange default

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Result - ${student?.name || 'Student'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      line-height: 1.6;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }
    
    .header {
      background: linear-gradient(135deg, ${primaryColor} 0%, #ea580c 100%);
      color: white;
      padding: 2rem;
      text-align: center;
    }
    
    .school-logo {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: white;
      margin: 0 auto 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      color: ${primaryColor};
    }
    
    .school-name {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    
    .school-address {
      font-size: 0.875rem;
      opacity: 0.9;
    }
    
    .result-title {
      background: #1e293b;
      color: white;
      text-align: center;
      padding: 0.75rem;
      font-size: 1.125rem;
      font-weight: 600;
    }
    
    .student-info {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      padding: 1.5rem 2rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .info-item {
      display: flex;
      gap: 0.5rem;
    }
    
    .info-label {
      font-weight: 600;
      color: #64748b;
      min-width: 80px;
    }
    
    .info-value {
      color: #1e293b;
    }
    
    .results-table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }
    
    .results-table th {
      background: ${primaryColor};
      color: white;
      padding: 0.75rem;
      text-align: left;
      font-weight: 600;
      font-size: 0.875rem;
    }
    
    .results-table td {
      padding: 0.75rem;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .results-table tr:nth-child(even) {
      background: #f8fafc;
    }
    
    .results-table tr:hover {
      background: #fef3c7;
    }
    
    .grade-a { color: #16a34a; font-weight: bold; }
    .grade-b { color: #2563eb; font-weight: bold; }
    .grade-c { color: #ca8a04; font-weight: bold; }
    .grade-d { color: #ea580c; font-weight: bold; }
    .grade-f { color: #dc2626; font-weight: bold; }
    
    .summary-section {
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      color: white;
      padding: 1.5rem 2rem;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      text-align: center;
    }
    
    .summary-item {
      padding: 1rem;
      background: rgba(255,255,255,0.1);
      border-radius: 0.5rem;
    }
    
    .summary-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      opacity: 0.8;
      margin-bottom: 0.25rem;
    }
    
    .summary-value {
      font-size: 1.5rem;
      font-weight: bold;
    }
    
    .grading-scale {
      padding: 1.5rem 2rem;
      background: #f8fafc;
    }
    
    .grading-scale h3 {
      font-size: 0.875rem;
      color: #64748b;
      margin-bottom: 0.75rem;
    }
    
    .grade-items {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    
    .grade-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: #475569;
    }
    
    .grade-badge {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 0.75rem;
    }
    
    .footer {
      padding: 1.5rem 2rem;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 0.75rem;
    }
    
    .signature-section {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
      padding: 2rem;
    }
    
    .signature-box {
      text-align: center;
    }
    
    .signature-line {
      border-top: 1px solid #1e293b;
      margin-top: 3rem;
      padding-top: 0.5rem;
      font-size: 0.875rem;
      color: #64748b;
    }
    
    @media print {
      body { background: white; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="school-logo">
        ${school?.logo ? `<img src="${school.logo}" alt="${school?.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : '🏫'}
      </div>
      <div class="school-name">${school?.name || 'School Name'}</div>
      <div class="school-address">${school?.address || ''}</div>
      ${school?.phone ? `<div class="school-address">Tel: ${school.phone}</div>` : ''}
    </div>
    
    <div class="result-title">
      STUDENT ACADEMIC REPORT - ${period?.name?.toUpperCase() || 'TERM'} ${session?.name || ''}
    </div>
    
    <div class="student-info">
      <div class="info-item">
        <span class="info-label">Name:</span>
        <span class="info-value">${student?.name || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Class:</span>
        <span class="info-value">${studentClass?.name || 'N/A'} ${studentClass?.section || ''}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Roll No:</span>
        <span class="info-value">${student?.rollNumber || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Session:</span>
        <span class="info-value">${session?.name || 'N/A'}</span>
      </div>
    </div>
    
    <table class="results-table">
      <thead>
        <tr>
          <th>S/N</th>
          <th>Subject</th>
          ${results?.[0]?.componentScores?.map((cs: any) => `<th>${cs.name}</th>`).join('') || '<th>Score</th>'}
          <th>Total</th>
          <th>Grade</th>
          <th>Remark</th>
        </tr>
      </thead>
      <tbody>
        ${results?.map((result: any, index: number) => `
          <tr>
            <td>${index + 1}</td>
            <td>${result.subject?.name || 'N/A'}</td>
            ${result.componentScores?.map((cs: any) => `<td>${cs.score || 0}</td>`).join('') || '<td>0</td>'}
            <td><strong>${result.total || 0}</strong></td>
            <td class="grade-${(result.grade || 'f').toLowerCase()}">${result.grade || 'N/A'}</td>
            <td>${result.remark || 'N/A'}</td>
          </tr>
        `).join('') || '<tr><td colspan="6">No results available</td></tr>'}
      </tbody>
    </table>
    
    <div class="summary-section">
      <div class="summary-item">
        <div class="summary-label">Total Score</div>
        <div class="summary-value">${summary?.totalScore || 0}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Subjects</div>
        <div class="summary-value">${summary?.totalSubjects || 0}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Average</div>
        <div class="summary-value">${summary?.average || 0}%</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Overall</div>
        <div class="summary-value">${summary?.overallGrade || 'N/A'}</div>
      </div>
    </div>
    
    <div class="grading-scale">
      <h3>GRADING SCALE</h3>
      <div class="grade-items">
        ${gradingScale?.length > 0 
          ? gradingScale.map((g: any) => `
            <div class="grade-item">
              <span class="grade-badge" style="background: ${getGradeColor(g.grade)}">${g.grade}</span>
              <span>${g.minScore}-${g.maxScore}% (${g.remark})</span>
            </div>
          `).join('')
          : `
            <div class="grade-item"><span class="grade-badge" style="background:#16a34a">A</span><span>70-100% (Excellent)</span></div>
            <div class="grade-item"><span class="grade-badge" style="background:#2563eb">B</span><span>60-69% (Very Good)</span></div>
            <div class="grade-item"><span class="grade-badge" style="background:#ca8a04">C</span><span>50-59% (Good)</span></div>
            <div class="grade-item"><span class="grade-badge" style="background:#ea580c">D</span><span>40-49% (Pass)</span></div>
            <div class="grade-item"><span class="grade-badge" style="background:#dc2626">F</span><span>0-39% (Fail)</span></div>
          `
        }
      </div>
    </div>
    
    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-line">Class Teacher's Signature</div>
      </div>
      <div class="signature-box">
        <div class="signature-line">Principal's Signature</div>
      </div>
    </div>
    
    <div class="footer">
      <p>Generated on ${new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <p style="margin-top:0.5rem">This is a computer-generated document.</p>
    </div>
  </div>
  
  <script>
    // Auto print for PDF
    // window.print();
  </script>
</body>
</html>
  `;
}

function getGradeColor(grade: string): string {
  switch (grade?.toUpperCase()) {
    case 'A': return '#16a34a';
    case 'B': return '#2563eb';
    case 'C': return '#ca8a04';
    case 'D': return '#ea580c';
    default: return '#dc2626';
  }
}
