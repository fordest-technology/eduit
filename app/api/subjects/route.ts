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
    const schoolId =
      session.role === "super_admin"
        ? searchParams.get("schoolId") || undefined
        : session.schoolId;

    // Get levelId from query params if it exists
    const levelId = searchParams.get("levelId") || undefined;

    // Create the where clause dynamically
    const whereClause: any = {
      schoolId: schoolId as string,
    };

    // Add levelId filter if provided
    if (levelId) {
      whereClause.levelId = levelId;
    }

    const subjects = await prisma.subject.findMany({
      where: whereClause,
      include: {
        department: true,
        level: true,
        _count: {
          select: {
            teachers: true,
            classes: true,
            students: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
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
    const { name, code, description, departmentId, levelId, schoolId } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Subject name is required" },
        { status: 400 }
      );
    }

    // Determine school ID
    const finalSchoolId =
      session.role === "super_admin" && schoolId ? schoolId : session.schoolId;

    if (!finalSchoolId) {
      return NextResponse.json(
        { error: "School ID is required" },
        { status: 400 }
      );
    }

    // If code is provided, check if it already exists in the same school
    if (code) {
      const existingSubject = await prisma.subject.findFirst({
        where: {
          code,
          schoolId: finalSchoolId,
        },
      });

      if (existingSubject) {
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

      if (!department || department.schoolId !== finalSchoolId) {
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

      if (!level || level.schoolId !== finalSchoolId) {
        return NextResponse.json(
          { error: "Invalid school level" },
          { status: 400 }
        );
      }
    }

    try {
      // Create subject
      const subject = await prisma.subject.create({
        data: {
          name,
          code: code || null, // Make code null if not provided
          description,
          schoolId: finalSchoolId,
          departmentId: departmentId || null,
          levelId: levelId || null,
        },
        include: {
          department: true,
          level: true,
        },
      });

      return NextResponse.json(subject, { status: 201 });
    } catch (error: any) {
      // Handle any other potential database errors
      console.error("Error creating subject:", error);
      if (error?.code === "P2002") {
        return NextResponse.json(
          { error: "A subject with this code already exists" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Failed to create subject" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error creating subject:", error);
    return NextResponse.json(
      { error: "Failed to create subject" },
      { status: 500 }
    );
  }
}
