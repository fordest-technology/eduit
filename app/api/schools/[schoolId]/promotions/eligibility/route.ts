import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ schoolId: string }> }
) {
    try {
        const { schoolId } = await params;
        const session = await getSession();

        if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "SCHOOL_ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const classId = searchParams.get("classId");
        const sessionId = searchParams.get("sessionId");

        if (!classId || !sessionId) {
            return NextResponse.json({ error: "classId and sessionId are required" }, { status: 400 });
        }

        // 1. Fetch all students in the class
        const studentClasses = await prisma.studentClass.findMany({
            where: {
                classId,
                sessionId,
                status: "ACTIVE",
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        // 2. Fetch results and configuration
        const results = await prisma.result.findMany({
            where: {
                sessionId,
                studentId: { in: studentClasses.map(sc => sc.studentId) },
            },
        });

        const config = await prisma.resultConfiguration.findUnique({
            where: {
                schoolId_sessionId: {
                    schoolId,
                    sessionId,
                },
            },
            include: {
                periods: true,
            },
        });

        if (!config) {
            return NextResponse.json({ error: "Result configuration not found for this session" }, { status: 404 });
        }

        // 3. Calculate averages
        const studentsWithPerf = studentClasses.map(sc => {
            const studentResults = results.filter(r => r.studentId === sc.studentId);

            // Group results by period
            const perPeriodTotal = new Map<string, { sum: number, count: number }>();
            studentResults.forEach(r => {
                const current = perPeriodTotal.get(r.periodId) || { sum: 0, count: 0 };
                current.sum += r.total;
                current.count += 1;
                perPeriodTotal.set(r.periodId, current);
            });

            // Calculate weighted annual average
            let totalWeightedAverage = 0;
            let totalWeight = 0;

            config.periods.forEach(period => {
                const stats = perPeriodTotal.get(period.id);
                if (stats && stats.count > 0) {
                    const periodAverage = stats.sum / stats.count;
                    totalWeightedAverage += periodAverage * period.weight;
                    totalWeight += period.weight;
                }
            });

            const annualAverage = totalWeight > 0 ? totalWeightedAverage / totalWeight : 0;

            return {
                id: sc.studentId,
                name: sc.student.user.name,
                email: sc.student.user.email,
                annualAverage: parseFloat(annualAverage.toFixed(2)),
                resultsCount: studentResults.length,
                isEligible: annualAverage >= 40, // Default pass mark, will be dynamic in UI
            };
        });

        return NextResponse.json(studentsWithPerf);
    } catch (err) {
        console.error("Error fetching promotion data:", err);
        return NextResponse.json({ error: "Failed to fetch promotion data" }, { status: 500 });
    }
}
