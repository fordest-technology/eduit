import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Define proper interfaces for our data
interface StudentResponse {
  id: string;
  userId: string;
  name: string;
  email: string;
  profileImage: string | null;
  classes: {
    id: string;
    name: string;
    section?: string | null;
  }[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Only super_admin and school_admin should have access
    if (!["super_admin", "school_admin"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const departmentId = params.id;

    if (!departmentId) {
      return NextResponse.json(
        { error: "Department ID is required" },
        { status: 400 }
      );
    }

    // Check if the department exists and belongs to the school
    const department = await prisma.department.findUnique({
      where: {
        id: departmentId,
        schoolId: session.schoolId,
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    // Get students in this department
    const students = await prisma.student.findMany({
      where: {
        departmentId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
        classes: {
          include: {
            class: true,
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    // Reshape the response to match the expected format in the frontend
    const formattedStudents: StudentResponse[] = students.map((student) => ({
      id: student.id,
      userId: student.userId,
      name: student.user.name,
      email: student.user.email,
      profileImage: student.user.profileImage,
      classes: student.classes.map((sc) => ({
        id: sc.class.id,
        name: sc.class.name,
        section: sc.class.section,
      })),
    }));

    return NextResponse.json(formattedStudents);
  } catch (error) {
    console.error("Error fetching department students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const departmentId = params.id;
    const body = await request.json();
    const { studentIds } = body;

    if (!departmentId) {
      return NextResponse.json(
        { error: "Department ID is required" },
        { status: 400 }
      );
    }

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: "Student IDs are required" },
        { status: 400 }
      );
    }

    // Check if the department exists and belongs to the school
    const department = await prisma.department.findUnique({
      where: {
        id: departmentId,
        schoolId: session.schoolId,
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    // Update students to this department
    const updatePromises = studentIds.map((studentId) =>
      prisma.student.update({
        where: {
          id: studentId,
          user: {
            schoolId: session.schoolId,
          },
        },
        data: {
          departmentId,
        },
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json(
      { message: "Students assigned to department successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error assigning students to department:", error);
    return NextResponse.json(
      { error: "Failed to assign students to department" },
      { status: 500 }
    );
  }
}
