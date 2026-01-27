import PDFDocument from 'pdfkit';
import axios from 'axios';
import path from 'path';
import fs from 'fs';

export interface RenderData {
    student: any;
    school: any;
    studentClass: any;
    academicSession: any;
    period: any;
    results: any[];
    gradingScale: any[];
    summary: {
        totalScore: number;
        average: string;
        overallGrade: string;
        position?: string;
        studentsInClass?: number;
    };
}

export async function renderTemplateToPDF(doc: any, template: any, data: RenderData) {
    const { elements } = template.content || template; // Handle both DB model and raw JSON

    // Sort elements by z-index if available, or just render in order
    // In our JSON, they are usually in order of background to foreground
    for (const element of elements) {
        await renderElement(doc, element, data);
    }
}

// Fixed scale factor: Template Width 794px -> A4 Width 595.28pt. Ratio ~ 0.7497
const SCALE = 0.75;

async function renderElement(doc: any, element: any, data: RenderData) {
    let { type, x, y, width, height, style = {}, metadata = {} } = element;
    
    // Apply Global Scaling manually to coordinates
    x = x * SCALE;
    y = y * SCALE;
    width = width * SCALE;
    height = height * SCALE;

    // Scale font size if present
    if (style.fontSize) style = { ...style, fontSize: style.fontSize * SCALE };
    
    // Scale column widths if present in metadata
    if (metadata.columnWidths) {
        metadata = { ...metadata, columnWidths: metadata.columnWidths.map((w: number) => w * SCALE) };
    }

    switch (type) {
        case 'shape':
        case 'line':
            renderShape(doc, x, y, width, height, style);
            break;
        case 'text':
            renderText(doc, element.content, x, y, width, height, style);
            break;
        case 'dynamic':
            renderDynamic(doc, element, data, x, y, width, height, style, metadata);
            break;
        case 'image':
            await renderImage(doc, element, data, x, y, width, height, style, metadata);
            break;
        case 'table':
            renderGenericTable(doc, element, data, x, y, width, height, style, metadata);
            break;
    }
}

function applyStyle(doc: any, style: any) {
    if (style.color) doc.fillColor(style.color);
    if (style.fontSize) doc.fontSize(style.fontSize); // Already scaled
    
    let font = 'Helvetica';
    if (style.fontWeight === 'bold') font = 'Helvetica-Bold';
    if (style.fontStyle === 'italic') font = 'Helvetica-Oblique';
    doc.font(font);
}

function renderShape(doc: any, x: number, y: number, width: number, height: number, style: any) {
    doc.save();
    
    if (style.backgroundColor) {
        doc.rect(x, y, width, height).fill(style.backgroundColor);
    }
    
    if (style.borderColor && style.borderWidth) {
        doc.rect(x, y, width, height)
           .lineWidth(style.borderWidth)
           .strokeColor(style.borderColor)
           .stroke();
    } else if (style.borderBottom) {
        const [widthStr, type, color] = style.borderBottom.split(' ');
        const w = parseInt(widthStr) || 1;
        doc.moveTo(x, y + height)
           .lineTo(x + width, y + height)
           .lineWidth(w)
           .strokeColor(color || '#000000')
           .stroke();
    }
    
    doc.restore();
}

function renderText(doc: any, content: string, x: number, y: number, width: number, height: number, style: any) {
    if (!content) return;
    doc.save();
    applyStyle(doc, style);
    
    const options: any = {
        width,
        align: style.textAlign || 'left',
    };
    
    doc.text(content, x, y, options);
    doc.restore();
}

function renderDynamic(doc: any, element: any, data: RenderData, x: number, y: number, width: number, height: number, style: any, metadata: any) {
    const field = metadata.field;
    let content = '';

    switch (field) {
        case 'student_name': content = data.student.user.name; break;
        case 'admission_number': content = data.student.admissionNumber || data.studentClass?.rollNumber || 'N/A'; break;
        case 'class_name': content = data.studentClass?.class?.name || 'N/A'; break;
        case 'class_section': content = data.studentClass?.class?.section || 'N/A'; break;
        case 'academic_session': content = data.academicSession?.name || 'N/A'; break;
        case 'term_name': content = data.period?.name || 'N/A'; break;
        case 'total_score': content = data.summary.totalScore.toString(); break;
        case 'average_score': content = `${data.summary.average}%`; break;
        case 'overall_grade': content = data.summary.overallGrade; break;
        case 'position': content = data.summary.position || 'N/A'; break;
        case 'students_in_class': content = data.summary.studentsInClass?.toString() || 'N/A'; break;
        case 'school_name': content = data.school.name; break;
        case 'school_address': content = data.school.address || ''; break;
        case 'school_motto': content = data.school.motto || ''; break;
        case 'gender': content = data.student.gender || 'N/A'; break;
        case 'teacher_comment': content = data.results[0]?.teacherComment || ''; break;
        case 'admin_comment': content = data.results[0]?.adminComment || ''; break;
        case 'cumulative_total': content = ((data.cumulative?.previousTotal || 0) + data.summary.totalScore).toString(); break;
        case 'cumulative_average': content = `${data.cumulative?.average || '0'}%`; break;
        case 'term_count': content = data.cumulative?.termCount?.toString() || '1'; break;
        case 'grading_scale': 
            content = data.gradingScale.map(s => `${s.grade}: ${s.minScore}-${s.maxScore}`).join(', ');
            break;
    }

    if (metadata.displayType === 'list' && field === 'grading_scale') {
        renderText(doc, data.gradingScale.map(s => `${s.grade}: ${s.minScore}-${s.maxScore}% (${s.remark})`).join('\n'), x, y, width, height, style);
    } else {
        renderText(doc, content, x, y, width, height, style);
    }
}

async function renderImage(doc: any, element: any, data: RenderData, x: number, y: number, width: number, height: number, style: any, metadata: any) {
    const field = metadata.field;
    let imageUrl = '';

    if (field === 'school_logo') imageUrl = data.school.logo;
    if (field === 'student_photo') imageUrl = data.student.user.image || data.student.user.profileImage;

    if (imageUrl) {
        try {
            let buffer: Buffer;
            
            if (imageUrl.startsWith('http')) {
                const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                buffer = Buffer.from(response.data, 'binary');
            } else {
                // Handle local paths like /uploads/...
                const cleanPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
                const absolutePath = path.join(process.cwd(), 'public', cleanPath);
                
                if (fs.existsSync(absolutePath)) {
                    buffer = fs.readFileSync(absolutePath);
                } else {
                    throw new Error(`Local file not found: ${absolutePath}`);
                }
            }
            
            doc.image(buffer, x, y, { fit: [width, height] });
        } catch (e) {
            console.error(`Failed to load image ${field}:`, e);
            doc.save();
            doc.rect(x, y, width, height).strokeColor('#e5e7eb').stroke();
            doc.fontSize(8 * SCALE).fillColor('#94a3b8').text('Image Error', x + 5, y + height / 2, { width: width - 10, align: 'center' });
            doc.restore();
        }
    } else if (metadata.isPlaceholder) {
        doc.save();
        doc.rect(x, y, width, height).dash(5, { space: 2 }).strokeColor('#cbd5e1').stroke();
        doc.fontSize(8 * SCALE).fillColor('#94a3b8').text(field.replace(/_/g, ' ').toUpperCase(), x, y + height / 2, { width, align: 'center' });
        doc.restore();
    }
}

function renderGenericTable(doc: any, element: any, data: RenderData, x: number, y: number, width: number, height: number, style: any, metadata: any) {
    const rows = metadata.rows || 3;
    const cols = metadata.cols || 3;
    const headers = metadata.headers || [];
    const tableType = metadata.tableType;
    const borderColor = style.borderColor || '#000000';
    const borderWidth = style.borderWidth || 0.5;
    const fontSize = (style.fontSize || 11) * SCALE;
    
    // Calculate column widths based on metadata.columnWidths (percentages/proportions)
    let colWidths: number[] = [];
    if (metadata.columnWidths && metadata.columnWidths.length === cols) {
        const totalProp = metadata.columnWidths.reduce((a: number, b: number) => a + b, 0);
        colWidths = metadata.columnWidths.map((w: number) => (w / totalProp) * width);
    } else {
        // Default equal widths
        colWidths = Array(cols).fill(width / cols);
    }

    doc.save();

    // 1. Render Headers
    const hasHeaders = headers.length > 0 && headers.some((h: string) => h && h.trim() !== "");
    let currentY = y;
    const headerHeight = 22 * SCALE;

    if (hasHeaders) {
        doc.rect(x, y, width, headerHeight).fill(style.headerBgColor || '#1e293b');
        doc.fillColor(style.headerTextColor || '#ffffff').fontSize(fontSize).font('Helvetica-Bold');
        
        let headerX = x;
        for (let i = 0; i < cols; i++) {
            const hText = (headers[i] || "").toUpperCase();
            // Centering math: Call at Y + Height/2 with middle baseline
            doc.text(hText, headerX + 2, y + (headerHeight / 2), { 
                width: colWidths[i] - 4, 
                align: 'center',
                baseline: 'middle',
                lineBreak: false
            });
            
            // Vertical header lines
            if (i < cols - 1) {
                doc.lineWidth(borderWidth)
                   .strokeColor(borderColor)
                   .moveTo(headerX + colWidths[i], y)
                   .lineTo(headerX + colWidths[i], y + headerHeight)
                   .stroke();
            }
            headerX += colWidths[i];
        }
        currentY += headerHeight;
    }

    // 2. Render Rows
    const availableHeight = height - (hasHeaders ? headerHeight : 0);
    const rowHeight = availableHeight / rows;
    doc.fontSize(fontSize).font('Helvetica');

    // Get Data Source
    let dataSource: any[] = [];
    if (tableType === 'subjects') {
        dataSource = data.results || [];
    } else if (tableType === 'affective' || tableType === 'psychomotor') {
        const traits = metadata.traits || metadata.skills || [];
        dataSource = traits.map((t: string) => ({ name: t, type: tableType }));
    }

    for (let r = 0; r < rows; r++) {
        // Row background (alternating)
        if (r % 2 === 1 && style.altRowColor) {
            doc.rect(x, currentY, width, rowHeight).fill(style.altRowColor);
        }

        // Horizontal line
        doc.lineWidth(borderWidth)
           .strokeColor(borderColor)
           .moveTo(x, currentY)
           .lineTo(x + width, currentY)
           .stroke();

        let rowX = x;
        const rowData = dataSource[r];

        for (let c = 0; c < cols; c++) {
            let cellText = "";
            doc.fillColor(style.color || '#000000');

            if (rowData) {
                if (tableType === 'subjects') {
                    // Smart mapping for subjects table
                    const header = (headers[c] || "").toUpperCase();
                    
                    if (c === 0 || header.includes("SUBJECT")) {
                        cellText = rowData.subject?.name || "";
                    } else if (header === "TOTAL") {
                        cellText = (rowData.total || "0").toString();
                        doc.font('Helvetica-Bold');
                    } else if (header === "GRADE") {
                        cellText = rowData.grade || "-";
                    } else if (header === "REMARK" || header === "REMARKS") {
                        cellText = rowData.remark || "-";
                    } else {
                        // Dynamic match by component name
                        const matchingScore = rowData.componentScores?.find((cs: any) => 
                            cs.component.name.toUpperCase() === header || 
                            header.includes(cs.component.name.toUpperCase()) ||
                            cs.component.name.toUpperCase().includes(header)
                        );
                        cellText = matchingScore ? matchingScore.score.toString() : "-";
                    }
                } else if (tableType === 'affective' || tableType === 'psychomotor') {
                    // Mapping for traits/psychomotor
                    const traitData = tableType === 'affective' ? data.results[0]?.affectiveTraits : data.results[0]?.psychomotorSkills;
                    if (c === 0) {
                        cellText = rowData.name || "";
                    } else {
                        const header = headers[c];
                        const rating = traitData?.[rowData.name];
                        if (cols > 2) {
                            if (rating?.toString() === header) cellText = "✓";
                        } else {
                            cellText = rating?.toString() || "";
                        }
                    }
                }
            }

            if (cellText) {
                // Centering math: Call at currentY + Height/2 with middle baseline
                doc.text(cellText, rowX + 2, currentY + (rowHeight / 2), {
                    width: colWidths[c] - 4,
                    align: 'center',
                    baseline: 'middle',
                    lineBreak: false
                });
            }

            // Vertical cell lines
            if (c < cols - 1) {
                doc.lineWidth(borderWidth)
                   .strokeColor(borderColor)
                   .moveTo(rowX + colWidths[c], currentY)
                   .lineTo(rowX + colWidths[c], currentY + rowHeight)
                   .stroke();
            }
            rowX += colWidths[c];
            doc.font('Helvetica'); // Reset font for next cell
        }
        currentY += rowHeight;
    }

    // Final bottom border and side borders
    doc.lineWidth(borderWidth).strokeColor(borderColor)
       .moveTo(x, currentY).lineTo(x + width, currentY).stroke() // Bottom
       .rect(x, y, width, currentY - y).stroke(); // Outer frame

    doc.restore();
}
