import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subjectId = params.id;

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
  { params }: { params: { id: Promise<string> } }
) {
  const session = await getSession();

  if (
    !session ||
    (session.role !== "super_admin" && session.role !== "school_admin")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subjectId = await params.id;
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

    // If code is being changed, check for uniqueness within the school
    if (code && code !== existingSubject.code) {
      const existingSubjectWithCode = await prisma.subject.findFirst({
        where: {
          code,
          schoolId: existingSubject.schoolId,
          id: { not: subjectId },
        },
      });

      if (existingSubjectWithCode) {
        return NextResponse.json(
          { error: "A subject with this code already exists in your school" },
          { status: 400 }
        );
      }
    }

    // If departmentId is provided, verify it belongs to the school
    if (departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
        select: { schoolId: true },
      });

      if (!department || department.schoolId !== existingSubject.schoolId) {
        return NextResponse.json(
          { error: "Invalid department" },
          { status: 400 }
        );
      }
    }

    // If levelId is provided, verify it belongs to the school
    if (levelId) {
      const level = await prisma.schoolLevel.findUnique({
        where: { id: levelId },
        select: { schoolId: true },
      });

      if (!level || level.schoolId !== existingSubject.schoolId) {
        return NextResponse.json(
          { error: "Invalid school level" },
          { status: 400 }
        );
      }
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
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A subject with this code already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update subject" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();

  if (
    !session ||
    (session.role !== "super_admin" && session.role !== "school_admin")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subjectId = params.id;

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

    // Delete subject
    await prisma.subject.delete({
      where: { id: subjectId },
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
  { params }: { params: { id: string } }
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
    const subjectId = params.id;
    const body = await request.json();
    const { name, code, description, departmentId, levelId } = body;

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

    // If code is being changed, check for uniqueness within the school
    if (code !== undefined && code !== existingSubject.code) {
      const existingSubjectWithCode = await prisma.subject.findFirst({
        where: {
          code,
          schoolId: existingSubject.schoolId,
          id: { not: subjectId },
        },
      });

      if (existingSubjectWithCode) {
        return NextResponse.json(
          { error: "A subject with this code already exists in your school" },
          { status: 400 }
        );
      }
    }

    // If departmentId is provided, verify it belongs to the school
    if (departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
        select: { schoolId: true },
      });

      if (!department || department.schoolId !== existingSubject.schoolId) {
        return NextResponse.json(
          { error: "Invalid department" },
          { status: 400 }
        );
      }
    }

    // If levelId is provided, verify it belongs to the school
    if (levelId) {
      const level = await prisma.schoolLevel.findUnique({
        where: { id: levelId },
        select: { schoolId: true },
      });

      if (!level || level.schoolId !== existingSubject.schoolId) {
        return NextResponse.json(
          { error: "Invalid school level" },
          { status: 400 }
        );
      }
    }

    // Update subject with only the provided fields
    const subject = await prisma.subject.update({
      where: { id: subjectId },
      data: updateData,
      include: {
        department: true,
        level: true,
      },
    });

    return NextResponse.json(subject);
  } catch (error: any) {
    console.error("Error updating subject:", error);
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A subject with this code already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update subject" },
      { status: 500 }
    );
  }
}
