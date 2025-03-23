import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// GET all parents for a student
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const student = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: Role.STUDENT,
      },
      include: {
        parents: {
          include: {
            parent: true,
          },
        },
      },
    });

    if (!student) {
      return new NextResponse("Student not found", { status: 404 });
    }

    // Get all parents to allow adding new ones
    const allParents = await prisma.user.findMany({
      where: {
        role: Role.PARENT,
        schoolId: student.schoolId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        phone: true,
      },
    });

    // Format already linked parents
    const linkedParents = student.parents.map((sp) => ({
      id: sp.id,
      parentId: sp.parentId,
      studentId: sp.studentId,
      relation: sp.relation,
      parent: {
        id: sp.parent.id,
        name: sp.parent.name,
        email: sp.parent.email,
        profileImage: sp.parent.profileImage,
        phone: sp.parent.phone,
      },
    }));

    // Return all parents and the linked parents
    return NextResponse.json({
      studentParents: linkedParents,
      availableParents: allParents.filter(
        (p) => !linkedParents.some((lp) => lp.parentId === p.id)
      ),
    });
  } catch (error) {
    console.error("[STUDENT_PARENTS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// POST to link a parent to a student
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check permission (only admins and teachers can manage parent links)
    if (
      session.role !== Role.SUPER_ADMIN &&
      session.role !== Role.SCHOOL_ADMIN &&
      session.role !== Role.TEACHER
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const { parentId, relation } = body;

    if (!parentId) {
      return new NextResponse("Parent ID is required", { status: 400 });
    }

    // Verify student exists
    const student = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: Role.STUDENT,
      },
    });

    if (!student) {
      return new NextResponse("Student not found", { status: 404 });
    }

    // Verify parent exists
    const parent = await prisma.user.findUnique({
      where: {
        id: parentId,
        role: Role.PARENT,
      },
    });

    if (!parent) {
      return new NextResponse("Parent not found", { status: 404 });
    }

    // Check if the relationship already exists
    const existingRelation = await prisma.studentParent.findFirst({
      where: {
        studentId: params.id,
        parentId,
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
            parent: true,
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
        studentId: params.id,
        parentId,
        relation: relation || null,
      },
      include: {
        parent: true,
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check permission (only admins and teachers can manage parent links)
    if (
      session.role !== Role.SUPER_ADMIN &&
      session.role !== Role.SCHOOL_ADMIN &&
      session.role !== Role.TEACHER
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
        studentId: params.id,
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
