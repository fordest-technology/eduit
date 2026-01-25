import { type NextRequest, NextResponse } from "next/server";
import prisma, { withErrorHandling } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Helper function to convert BigInt values to numbers for serialization
function serializeBigInts(data: any): any {
    if (data === null || data === undefined) {
        return data;
    }

    if (typeof data === "bigint") {
        return Number(data);
    }

    if (data instanceof Date) {
        return data;
    }

    if (Array.isArray(data)) {
        return data.map((item) => serializeBigInts(item));
    }

    if (typeof data === "object") {
        const result: any = {};
        for (const key in data) {
            result[key] = serializeBigInts(data[key]);
        }
        return result;
    }

    return data;
}

export async function GET(
    request: NextRequest,
    { params }: { params: { schoolId: string } }
) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { schoolId } = await Promise.resolve(params);

        // Verify user has access to this school's data
        if (session.role === "PARENT") {
            const parent = await withErrorHandling(() =>
                prisma.parent.findUnique({
                    where: { userId: session.id },
                    select: {
                        children: {
                            select: {
                                student: {
                                    select: {
                                        user: {
                                            select: {
                                                schoolId: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                })
            );

            if (!parent) {
                return NextResponse.json(
                    { error: "Parent profile not found" },
                    { status: 404 }
                );
            }

            // Check if parent has children in this school
            const hasAccessToSchool = parent.children.some(
                (child) => child.student.user.schoolId === schoolId
            );

            if (!hasAccessToSchool) {
                return NextResponse.json(
                    { error: "Unauthorized access to school data" },
                    { status: 403 }
                );
            }
        } else if (session.role === "STUDENT") {
            const student = await withErrorHandling(() =>
                prisma.student.findUnique({
                    where: { userId: session.id },
                    select: {
                        user: {
                            select: {
                                schoolId: true,
                            },
                        },
                    },
                })
            );

            if (!student || student.user.schoolId !== schoolId) {
                return NextResponse.json(
                    { error: "Unauthorized access to school data" },
                    { status: 403 }
                );
            }
        } else if (
            session.role !== "SUPER_ADMIN" &&
            session.schoolId !== schoolId
        ) {
            return NextResponse.json(
                { error: "Unauthorized access to school data" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const isCurrent =
            searchParams.get("isCurrent") === "true" ? true : undefined;

        const academicSessions = await withErrorHandling(() =>
            prisma.academicSession.findMany({
                where: {
                    schoolId,
                    ...(isCurrent !== undefined ? { isCurrent } : {}),
                },
                include: {
                    school: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    resultConfigurations: {
                        include: {
                            periods: {
                                select: {
                                    id: true,
                                    name: true,
                                    weight: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            studentClasses: true,
                            attendance: true,
                            results: true,
                            classes: true,
                        },
                    },
                },
                orderBy: {
                    startDate: "desc",
                },
            })
        );

        return NextResponse.json(serializeBigInts(academicSessions));
    } catch (error) {
        console.error("Error fetching academic sessions:", error);

        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
        const isConnectionError = errorMessage.includes(
            "Can't reach database server"
        );

        return NextResponse.json(
            {
                error: "Failed to fetch academic sessions",
                details: isConnectionError
                    ? "Database connection error"
                    : "Server error",
                isConnectionError,
            },
            { status: 500 }
        );
    }
}
