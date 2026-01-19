import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

interface RouteParams {
  params: { id: string } | Promise<{ id: string }>;
}

// GET a specific class
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const auth = await requireAuth(request);

    if (!auth.authenticated || !auth.user || !auth.user.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Next.js 15: params must be awaited
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const classDetails = await prisma.class.findUnique({
      where: {
        id: id,
        schoolId: auth.user.schoolId,
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                profileImage: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        level: true,
        subjects: {
          include: {
            subject: true,
          },
        },
        students: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                    profileImage: true,
                  },
                },
                department: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!classDetails) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Fetch other arms of the same class name
    const otherArms = await prisma.class.findMany({
      where: {
        schoolId: auth.user.schoolId,
        name: classDetails.name,
        id: { not: classDetails.id },
      },
      select: {
        id: true,
        section: true,
        _count: {
          select: {
            students: true,
          }
        }
      },
      orderBy: {
        section: "asc"
      }
    });

    return NextResponse.json({
      ...classDetails,
      otherArms
    });
  } catch (error) {
    console.error("[CLASS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH to update a class
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const auth = await requireAuth(request, [
      UserRole.SUPER_ADMIN,
      UserRole.SCHOOL_ADMIN,
    ]);

    if (!auth.authenticated || !auth.authorized) {
      return NextResponse.json(
        { error: "You are not authorized to perform this action" },
        { status: 403 }
      );
    }

    const { user } = auth;
    
    // Next.js 15: params must be awaited
    const resolvedParams = await params;
    const classId = resolvedParams.id;
    
    const body = await request.json();

    // Validate the class exists and belongs to the school
    const existingClass = await prisma.class.findUnique({
      where: {
        id: classId,
        schoolId: user.schoolId,
      },
    });

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Update the class
    const updatedClass = await prisma.class.update({
      where: {
        id: classId,
      },
      data: {
        name: body.name,
        section: body.section,
        teacherId: body.teacherId,
        levelId: body.levelId,
      },
      include: {
        level: true,
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedClass);
  } catch (error) {
    console.error("[CLASS_PUT]", error);
    return NextResponse.json(
      { error: "Failed to update class" },
      { status: 500 }
    );
  }
}

// DELETE a class
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const auth = await requireAuth(request, [
      UserRole.SUPER_ADMIN,
      UserRole.SCHOOL_ADMIN,
    ]);

    if (!auth.authenticated || !auth.authorized) {
      return NextResponse.json(
        { error: "You are not authorized to perform this action" },
        { status: 403 }
      );
    }

    const { user } = auth;
    
    // Next.js 15: params must be awaited
    const resolvedParams = await params;
    const classId = resolvedParams.id;

    // Validate the class exists and belongs to the school
    const existingClass = await prisma.class.findUnique({
      where: {
        id: classId,
        schoolId: user.schoolId,
      },
    });

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Use transaction to delete related records first to avoid foreign key violations
    await prisma.$transaction(async (tx) => {
      // 1. Delete StudentClass relations
      await tx.studentClass.deleteMany({
        where: {
          classId: classId,
        },
      });

      // 2. Delete ClassSubject relations
      await tx.classSubject.deleteMany({
        where: {
          classId: classId,
        },
      });

      // 3. Finally delete the class
      await tx.class.delete({
        where: {
          id: classId,
        },
      });
    });

    return NextResponse.json({ message: "Class deleted successfully" });
  } catch (error) {
    console.error("[CLASS_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete class" },
      { status: 500 }
    );
  }
}
