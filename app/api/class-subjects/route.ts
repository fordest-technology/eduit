import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const subjectId = searchParams.get("subjectId");

    const where: any = {};

    if (classId) {
      where.classId = classId;
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    // If not super admin, restrict to school
    if (session.role !== "super_admin" && session.schoolId) {
      where.class = {
        schoolId: session.schoolId,
      };
    }

    const classSubjects = await prisma.classSubject.findMany({
      where,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            section: true,
            schoolId: true,
          },
        },
        subject: true,
      },
    });

    return NextResponse.json(classSubjects);
  } catch (error) {
    console.error("Error fetching class subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch class subjects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (
    !session ||
    (session.role !== "super_admin" && session.role !== "school_admin")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { classId, subjectId } = body;

    // Validate required fields
    if (!classId || !subjectId) {
      return NextResponse.json(
        { error: "Class ID and Subject ID are required" },
        { status: 400 }
      );
    }

    // Check if class exists
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      select: { schoolId: true },
    });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Check if subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { schoolId: true },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Check if class and subject belong to the same school
    if (classData.schoolId !== subject.schoolId) {
      return NextResponse.json(
        { error: "Class and subject must belong to the same school" },
        { status: 400 }
      );
    }

    // Check if user has permission to assign subjects to this class
    if (
      session.role !== "super_admin" &&
      classData.schoolId !== session.schoolId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.classSubject.findFirst({
      where: {
        classId,
        subjectId,
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: "Subject is already assigned to this class" },
        { status: 400 }
      );
    }

    // Create class subject assignment
    const classSubject = await prisma.classSubject.create({
      data: {
        classId,
        subjectId,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            section: true,
          },
        },
        subject: true,
      },
    });

    return NextResponse.json(classSubject, { status: 201 });
  } catch (error) {
    console.error("Error assigning subject to class:", error);
    return NextResponse.json(
      { error: "Failed to assign subject to class" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();

  if (
    !session ||
    (session.role !== "super_admin" && session.role !== "school_admin")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");

  if (!classId || !subjectId) {
    return NextResponse.json(
      { error: "Class ID and subject ID are required" },
      { status: 400 }
    );
  }

  const classRecord = await prisma.class.findUnique({
    where: { id: classId },
  });

  if (!classRecord) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  if (
    session.role === "school_admin" &&
    classRecord.schoolId !== session.schoolId
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.classSubject.deleteMany({
    where: {
      classId,
      subjectId,
    },
  });

  return NextResponse.json({
    message: "Subject removed from class successfully",
  });
}
