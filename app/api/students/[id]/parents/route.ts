import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

// GET all parents for a student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;
    const session = await getSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const studentData = await prisma.student.findUnique({
      where: {
        id: studentId,
      },
      include: {
        user: true,
        parents: {
          include: {
            parent: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!studentData) {
      return new NextResponse("Student not found", { status: 404 });
    }

    // Get all parents in the same school to allow adding new ones
    const availableParents = await prisma.parent.findMany({
      where: {
        user: {
          schoolId: studentData.user.schoolId,
        },
      },
      include: {
        user: true,
      },
    });

    // Format already linked parents
    const linkedParents = studentData.parents.map((sp) => ({
      id: sp.id,
      parentId: sp.parentId,
      studentId: sp.studentId,
      relation: sp.relation,
      parent: {
        id: sp.parent.id, // This is Parent.id
        name: sp.parent.user.name,
        email: sp.parent.user.email,
        profileImage: sp.parent.user.profileImage,
        phone: sp.parent.phone,
      },
    }));

    // Return all parents and the linked parents
    // availableParents should exclude already linked ones
    return NextResponse.json({
      studentParents: linkedParents,
      availableParents: availableParents
        .filter((p) => !linkedParents.some((lp) => lp.parentId === p.id))
        .map((p) => ({
          id: p.id, // This is Parent.id
          name: p.user.name,
          email: p.user.email,
          profileImage: p.user.profileImage,
          phone: p.phone,
        })),
    });
  } catch (error) {
    console.error("[STUDENT_PARENTS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// POST to link a parent to a student
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;
    const session = await getSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check permission (only admins and teachers can manage parent links)
    if (
      session.role !== UserRole.SUPER_ADMIN &&
      session.role !== UserRole.SCHOOL_ADMIN &&
      session.role !== UserRole.TEACHER
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const { parentId, relation } = body;

    if (!parentId) {
      return new NextResponse("Parent ID is required", { status: 400 });
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: {
        id: studentId,
      },
    });

    if (!student) {
      return new NextResponse("Student not found", { status: 404 });
    }

    // Verify parent exists
    const parent = await prisma.parent.findUnique({
      where: {
        id: parentId,
      },
    });

    if (!parent) {
      return new NextResponse("Parent not found", { status: 404 });
    }

    // Check if the relationship already exists
    const existingRelation = await prisma.studentParent.findUnique({
      where: {
        studentId_parentId: {
          studentId,
          parentId,
        },
      },
    });

    if (existingRelation) {
      // If relation exists and a new relation value is provided, update it
      if (relation) {
        const updatedRelation = await prisma.studentParent.update({
          where: {
            id: existingRelation.id,
          },
          data: {
            relation,
          },
          include: {
            parent: {
              include: {
                user: true,
              },
            },
          },
        });
        return NextResponse.json(updatedRelation);
      }

      return new NextResponse("Parent already linked to this student", {
        status: 400,
      });
    }

    // Create the relationship
    const studentParent = await prisma.studentParent.create({
      data: {
        studentId,
        parentId,
        relation: relation || null,
      },
      include: {
        parent: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json(studentParent);
  } catch (error) {
    console.error("[STUDENT_PARENT_LINK]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// DELETE to remove a parent link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;
    const session = await getSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check permission (only admins and teachers can manage parent links)
    if (
      session.role !== UserRole.SUPER_ADMIN &&
      session.role !== UserRole.SCHOOL_ADMIN &&
      session.role !== UserRole.TEACHER
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const url = new URL(request.url);
    const parentLinkId = url.searchParams.get("linkId");

    if (!parentLinkId) {
      return new NextResponse("Parent link ID is required", { status: 400 });
    }

    // Check if the relationship exists
    const existingRelation = await prisma.studentParent.findUnique({
      where: {
        id: parentLinkId,
        studentId: studentId,
      },
    });

    if (!existingRelation) {
      return new NextResponse("Parent link not found", { status: 404 });
    }

    // Delete the relationship
    await prisma.studentParent.delete({
      where: {
        id: parentLinkId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[STUDENT_PARENT_UNLINK]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

