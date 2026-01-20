import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; studentId: string }> }
) {
    try {
        const { id, studentId } = await params;
        const session = await getSession();

        if (
            !session ||
            (session.role !== UserRole.SUPER_ADMIN &&
                session.role !== UserRole.SCHOOL_ADMIN &&
                session.role !== UserRole.TEACHER)
        ) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // studentId here is the linkId (StudentParent record ID)
        const linkId = studentId;

        // Get the relationship to check permissions - optimized query
        const relationship = await prisma.studentParent.findUnique({
            where: { id: linkId },
            select: {
                id: true,
                parent: {
                    select: {
                        user: {
                            select: {
                                id: true,
                                schoolId: true,
                            },
                        },
                    },
                },
            },
        });

        if (!relationship) {
            return new NextResponse("Relationship not found", { status: 404 });
        }

        // Verify the relationship belongs to the parent in the route
        if (relationship.parent.user.id !== id) {
            return new NextResponse("Forbidden: Relationship does not belong to this parent", { status: 403 });
        }

        // Check if user has permission to manage this relationship (school admin scope)
        if (
            session.role === UserRole.SCHOOL_ADMIN &&
            relationship.parent.user.schoolId !== session.schoolId
        ) {
            return new NextResponse("Forbidden: Parent belongs to another school", { status: 403 });
        }

        // Delete the relationship
        await prisma.studentParent.delete({
            where: { id: linkId },
        });

        // Create response with cache headers
        const response = new NextResponse(null, { status: 204 });
        response.headers.set(
            "Cache-Control",
            "private, no-cache, no-store, must-revalidate"
        );

        return response;
    } catch (error) {
        // Only log in development
        if (process.env.NODE_ENV !== "production") {
            console.error("[PARENT_UNLINK_STUDENT]", error);
        }

        return new NextResponse("Internal error", { status: 500 });
    }
}
