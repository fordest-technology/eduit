import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { renderTemplateToPDF, RenderData } from "@/lib/pdf-renderer";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.schoolId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { template } = await req.json();

        // Fetch real school branding from DB for 100% accuracy
        const school = await prisma.school.findUnique({
            where: { id: session.schoolId },
            select: {
                name: true,
                logo: true,
                address: true,
                phone: true,
                email: true,
            }
        });

        if (!school) {
            return NextResponse.json({ error: "School not found" }, { status: 404 });
        }

        // Handle both raw editor state and DB model structure
        const templateElements = template.elements || template.content?.elements;

        if (!templateElements) {
            console.error("Preview failed: Invalid template structure");
            return NextResponse.json({ error: "Invalid template structure" }, { status: 400 });
        }

        const cleanTemplate = {
            ...template,
            elements: templateElements
        };

        // Create mock data for preview
        const mockData: RenderData = {
            student: {
                user: { name: "John Doe", image: null },
                admissionNumber: "ADM-2026-001",
                gender: "Male"
            },
            school: {
                name: school.name,
                logo: school.logo,
                address: school.address || "No address provided",
                motto: "", // Not in DB schema yet
                phone: school.phone || "",
                email: school.email || ""
            },
            studentClass: {
                class: { name: "Grade 10", section: "A" },
                rollNumber: "10"
            },
            academicSession: { name: "2025/2026 Academic Session" },
            period: { name: "First Term" },
            results: [
                {
                    subject: { name: "Mathematics" },
                    total: 88,
                    grade: "A",
                    remark: "Excellent",
                    componentScores: [
                        { component: { name: "CA1" }, score: 15 },
                        { component: { name: "CA2" }, score: 13 },
                        { component: { name: "EXAM" }, score: 60 },
                        { component: { name: "1st Term" }, score: 85 },
                        { component: { name: "2nd Term" }, score: 88 }
                    ],
                    affectiveTraits: {
                        "Punctuality": "5", "Neatness": "4", "Politeness": "5", "Honesty": "4", 
                        "Cooperation": "5", "Attentiveness": "4", "Obedience": "5", "Self-Control": "4"
                    },
                    psychomotorSkills: {
                        "Handwriting": "4", "Games/Sports": "5", "Drawing": "3", 
                        "Music": "4", "Crafts": "5", "Tools Use": "4"
                    }
                },
                {
                    subject: { name: "English Language" },
                    total: 75,
                    grade: "B",
                    remark: "Very Good",
                    componentScores: [
                        { component: { name: "CA1" }, score: 12 },
                        { component: { name: "CA2" }, score: 13 },
                        { component: { name: "EXAM" }, score: 50 },
                        { component: { name: "1st Term" }, score: 72 },
                        { component: { name: "2nd Term" }, score: 75 }
                    ]
                },
                {
                    subject: { name: "Physics" },
                    total: 92,
                    grade: "A+",
                    remark: "Outstanding",
                    componentScores: [
                        { component: { name: "CA1" }, score: 14 },
                        { component: { name: "CA2" }, score: 15 },
                        { component: { name: "EXAM" }, score: 63 }
                    ]
                }
            ],
            gradingScale: [
                { grade: "A", minScore: 80, maxScore: 100, remark: "Distinction" },
                { grade: "B", minScore: 70, maxScore: 79, remark: "Credit" },
                { grade: "C", minScore: 60, maxScore: 69, remark: "Pass" },
                { grade: "F", minScore: 0, maxScore: 49, remark: "Fail" }
            ],
            summary: {
                totalScore: 255,
                average: "85.0",
                overallGrade: "A",
                position: "1st",
                studentsInClass: 25
            },
            cumulative: {
                previousTotal: 742,
                termCount: 1,
                average: "84.5"
            }
        };

        const canvasSize = cleanTemplate.canvasSize || { width: 794, height: 1123 };
        const orientation = canvasSize.width > canvasSize.height ? 'landscape' : 'portrait';

        const doc = new PDFDocument({ size: "A4", margin: 0, layout: orientation });
        const chunks: any[] = [];

        doc.on("data", (chunk) => chunks.push(chunk));

        return await new Promise((resolve) => {
            doc.on("end", () => {
                const result = Buffer.concat(chunks);
                resolve(new NextResponse(result, {
                    headers: {
                        "Content-Type": "application/pdf",
                        "Content-Disposition": 'inline; filename="preview.pdf"'
                    }
                }));
            });

            doc.on("error", (err) => {
                console.error("PDFDoc Error:", err);
                resolve(NextResponse.json({ error: "PDF Generation Error" }, { status: 500 }));
            });

            renderTemplateToPDF(doc, cleanTemplate, mockData)
                .then(() => {
                    doc.end();
                })
                .catch((err) => {
                    console.error("Render Error:", err);
                    resolve(NextResponse.json({ error: "Rendering Error" }, { status: 500 }));
                    doc.end();
                });
        });

    } catch (error) {
        console.error("Preview generation failed:", error);
        return NextResponse.json({ error: "Generation failed" }, { status: 500 });
    }
}
