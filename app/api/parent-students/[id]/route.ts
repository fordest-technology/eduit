import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get relationship ID from URL params
    const relationId = params.id;

    if (!relationId) {
      return new NextResponse(
        JSON.stringify({ error: "Relationship ID is required" }),
        { status: 400 }
      );
    }

    // Check authentication
    const session = await getSession();
    if (!session) {
      return new NextResponse(
        JSON.stringify({
          error: "You must be signed in to access this endpoint",
        }),
        { status: 401 }
      );
    }

    // Find the relationship to check permissions
    const relationship = await prisma.studentParent.findUnique({
      where: { id: relationId },
      include: {
        parent: {
          include: {
            user: true,
          },
        },
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!relationship) {
      return new NextResponse(
        JSON.stringify({ error: "Parent-student relationship not found" }),
        { status: 404 }
      );
    }

    // Check authorization
    const parentUser = relationship.parent.user;

    // Only admins or the parent can unlink
    if (
      session.role !== "super_admin" &&
      session.role !== "school_admin" &&
      session.id !== parentUser.id
    ) {
      return new NextResponse(
        JSON.stringify({
          error: "You do not have permission to perform this action",
        }),
        { status: 403 }
      );
    }

    // School admins can only manage parents in their school
    if (
      session.role === "school_admin" &&
      parentUser.schoolId !== session.schoolId
    ) {
      return new NextResponse(
        JSON.stringify({
          error: "You do not have permission to manage this relationship",
        }),
        { status: 403 }
      );
    }

    // Delete the relationship
    await prisma.studentParent.delete({
      where: { id: relationId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting parent-student relationship:", error);
    return new NextResponse(
      JSON.stringify({
        error: "An error occurred while deleting the relationship",
      }),
      { status: 500 }
    );
  }
}
