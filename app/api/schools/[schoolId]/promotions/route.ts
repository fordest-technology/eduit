import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ schoolId: string }> }
) {
    try {
        const { schoolId } = await params;
        const session = await getSession();

        if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "SCHOOL_ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { sessionId, promotions } = await request.json();

        if (!sessionId || !promotions || !Array.isArray(promotions)) {
            return NextResponse.json({ error: "sessionId and promotions array are required" }, { status: 400 });
        }

        // Process promotions in a transaction to ensure consistency
        const results = await prisma.$transaction(
            promotions.map((p) => {
                return prisma.studentClass.upsert({
                    where: {
                        studentId_classId_sessionId: {
                            studentId: p.studentId,
                            classId: p.classId,
                            sessionId: sessionId,
                        },
                    },
                    update: {
                        status: "ACTIVE",
                    },
                    create: {
                        studentId: p.studentId,
                        classId: p.classId,
                        sessionId: sessionId,
                        status: "ACTIVE",
                    },
                });
            })
        );

        return NextResponse.json({
            success: true,
            count: results.length,
            message: `${results.length} students processed successfully`
        });
    } catch (err) {
        console.error("Error executing promotions:", err);
        return NextResponse.json({ error: "Failed to execute promotions" }, { status: 500 });
    }
}
