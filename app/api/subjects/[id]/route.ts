import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";

interface RouteParams {
  params: { id: string } | Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const subjectId = resolvedParams.id;

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        department: true,
        teachers: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        classes: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                section: true,
              },
            },
          },
        },
      },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Check if user has permission to view this subject
    if (
      session.role !== UserRole.SUPER_ADMIN &&
      subject.schoolId !== session.schoolId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(subject);
  } catch (error) {
    console.error("Error fetching subject:", error);
    return NextResponse.json(
      { error: "Failed to fetch subject" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const session = await getSession();

  if (
    !session ||
    (session.role !== "super_admin" && session.role !== "school_admin")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const subjectId = resolvedParams.id;
    
    const body = await request.json();
    const { name, code, description, departmentId, levelId } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Subject name is required" },
        { status: 400 }
      );
    }

    // Check if subject exists and user has permission to update it
    const existingSubject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: {
        id: true,
        schoolId: true,
        code: true,
      },
    });

    if (!existingSubject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    if (
      session.role !== "super_admin" &&
      existingSubject.schoolId !== session.schoolId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update subject
    const subject = await prisma.subject.update({
      where: { id: subjectId },
      data: {
        name,
        code: code || null,
        description,
        departmentId: departmentId || null,
        levelId: levelId || null,
      },
      include: {
        department: true,
        level: true,
      },
    });

    return NextResponse.json(subject);
  } catch (error: any) {
    console.error("Error updating subject:", error);
    return NextResponse.json(
      { error: "Failed to update subject" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const session = await getSession();

  if (
    !session ||
    (session.role !== "super_admin" && session.role !== "school_admin")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const subjectId = resolvedParams.id;

    // Check if subject exists and user has permission to delete it
    const existingSubject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { schoolId: true },
    });

    if (!existingSubject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    if (
      session.role !== "super_admin" &&
      existingSubject.schoolId !== session.schoolId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Use transaction to cleanup related records
    await prisma.$transaction(async (tx) => {
        // 1. Delete ClassSubject relations
        await tx.classSubject.deleteMany({
            where: { subjectId }
        });

        // 2. Delete SubjectTeacher relations
        await tx.subjectTeacher.deleteMany({
            where: { subjectId }
        });

        // 3. Delete StudentSubject relations
        await tx.studentSubject.deleteMany({
            where: { subjectId }
        });

        // 4. Finally delete the subject
        await tx.subject.delete({
            where: { id: subjectId },
        });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting subject:", error);
    return NextResponse.json(
      { error: "Failed to delete subject" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const session = await getSession();

  if (
    !session ||
    (session.role !== UserRole.SUPER_ADMIN &&
      session.role !== UserRole.SCHOOL_ADMIN)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const subjectId = resolvedParams.id;

    const body = await request.json();
    const { name, code, description, departmentId, levelId, classIds } = body;

    // Check if subject exists and user has permission to update it
    const existingSubject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: {
        id: true,
        schoolId: true,
        code: true,
      },
    });

    if (!existingSubject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    if (
      session.role !== UserRole.SUPER_ADMIN &&
      existingSubject.schoolId !== session.schoolId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build update data object with only provided fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code || null;
    if (description !== undefined) updateData.description = description;
    if (departmentId !== undefined)
      updateData.departmentId = departmentId || null;
    if (levelId !== undefined) updateData.levelId = levelId || null;

    // Handle classIds update in a transaction
    const subject = await prisma.$transaction(async (tx) => {
      // 1. Update subject metadata
      const updatedSubject = await tx.subject.update({
        where: { id: subjectId },
        data: updateData,
        include: {
          department: true,
          level: true,
          teachers: {
            include: {
              teacher: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      profileImage: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              classes: true,
              teachers: true,
            },
          },
        },
      });

      // 2. Compute final class IDs if levelId or classIds were provided
      if (classIds !== undefined || levelId !== undefined) {
        let finalClassIds = classIds || [];
        
        // If we have a level, add all classes in that level
        const effectiveLevelId = levelId !== undefined ? levelId : updatedSubject.levelId;
        
        if (effectiveLevelId) {
          const levelClasses = await tx.class.findMany({
            where: { levelId: effectiveLevelId, schoolId: updatedSubject.schoolId },
            select: { id: true }
          });
          const levelClassIds = levelClasses.map(c => c.id);
          finalClassIds = Array.from(new Set([...finalClassIds, ...levelClassIds]));
        }

        await tx.classSubject.deleteMany({
            where: { subjectId }
        });
        if (finalClassIds.length > 0) {
            await tx.classSubject.createMany({
                data: finalClassIds.map(id => ({
                    subjectId,
                    classId: id
                }))
            });
        }
      }

      return updatedSubject;
    });

    // Transform teachers for the frontend
    const transformedSubject = {
      ...subject,
      teachers: subject.teachers.map((t) => ({
        teacher: {
          id: t.teacher.id,
          name: t.teacher.user.name,
          profileImage: t.teacher.user.profileImage,
          userId: t.teacher.user.id,
        },
      })),
    };

    return NextResponse.json(transformedSubject);
  } catch (error: any) {
    console.error("Error updating subject:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
