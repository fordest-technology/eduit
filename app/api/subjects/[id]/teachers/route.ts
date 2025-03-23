import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";

// Helper function to serialize BigInt values
function serializeBigInts(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "bigint") {
    return Number(data);
  }

  if (Array.isArray(data)) {
    return data.map((item) => serializeBigInts(item));
  }

  if (typeof data === "object") {
    const result: any = {};
    for (const key in data) {
      result[key] = serializeBigInts(data[key]);
    }
    return result;
  }

  return data;
}

// GET: Fetch teachers assigned to a subject
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check session and authorization
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the subject to ensure it exists and belongs to the school
    const subject = await prisma.subject.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Check if user has access to this subject's school
    if (session.schoolId !== subject.schoolId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch teachers assigned to this subject
    const subjectTeachers = await prisma.subjectTeacher.findMany({
      where: {
        subjectId: params.id,
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Transform the data to a more usable format
    const formattedTeachers = subjectTeachers.map((st) => ({
      id: st.id,
      teacherId: st.teacherId,
      name: st.teacher.user.name,
      email: st.teacher.user.email,
      profileImage: st.teacher.user.profileImage,
      userId: st.teacher.user.id,
    }));

    return NextResponse.json(serializeBigInts(formattedTeachers));
  } catch (error) {
    console.error("Error fetching subject teachers:", error);
    return NextResponse.json(
      { error: "Failed to fetch teachers" },
      { status: 500 }
    );
  }
}

// POST: Assign a teacher to a subject
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check session and authorization
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can assign teachers
    if (session.role !== "super_admin" && session.role !== "school_admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get request data
    const data = await request.json();
    const { teacherId } = data;

    if (!teacherId) {
      return NextResponse.json(
        { error: "Teacher ID is required" },
        { status: 400 }
      );
    }

    // Fetch the subject to ensure it exists and belongs to the school
    const subject = await prisma.subject.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Check if user has access to this subject's school
    if (session.schoolId !== subject.schoolId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if the teacher exists and belongs to the school
    const teacher = await prisma.teacher.findUnique({
      where: {
        id: teacherId,
      },
      include: {
        user: true,
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    if (teacher.user.schoolId !== session.schoolId) {
      return NextResponse.json(
        { error: "Teacher belongs to a different school" },
        { status: 403 }
      );
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.subjectTeacher.findFirst({
      where: {
        subjectId: params.id,
        teacherId: teacherId,
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: "Teacher is already assigned to this subject" },
        { status: 400 }
      );
    }

    // Create the assignment
    const subjectTeacher = await prisma.subjectTeacher.create({
      data: {
        subjectId: params.id,
        teacherId: teacherId,
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const formattedTeacher = {
      id: subjectTeacher.id,
      teacherId: subjectTeacher.teacherId,
      name: subjectTeacher.teacher.user.name,
      email: subjectTeacher.teacher.user.email,
      profileImage: subjectTeacher.teacher.user.profileImage,
      userId: subjectTeacher.teacher.user.id,
    };

    return NextResponse.json(serializeBigInts(formattedTeacher), {
      status: 201,
    });
  } catch (error) {
    console.error("Error assigning teacher to subject:", error);
    return NextResponse.json(
      { error: "Failed to assign teacher" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a teacher from a subject
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check session and authorization
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can remove teacher assignments
    if (session.role !== "super_admin" && session.role !== "school_admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const assignmentId = url.searchParams.get("assignmentId");

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      );
    }

    // Fetch the assignment to verify it belongs to the requested subject
    const assignment = await prisma.subjectTeacher.findUnique({
      where: {
        id: assignmentId,
      },
      include: {
        subject: true,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Teacher assignment not found" },
        { status: 404 }
      );
    }

    // Verify the assignment is for the requested subject
    if (assignment.subjectId !== params.id) {
      return NextResponse.json(
        { error: "Assignment does not belong to this subject" },
        { status: 400 }
      );
    }

    // Check if user has access to this subject's school
    if (session.schoolId !== assignment.subject.schoolId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete the assignment
    await prisma.subjectTeacher.delete({
      where: {
        id: assignmentId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing teacher from subject:", error);
    return NextResponse.json(
      { error: "Failed to remove teacher" },
      { status: 500 }
    );
  }
}

// PUT: Update all teacher assignments for a subject
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check session and authorization
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can manage teacher assignments
    if (session.role !== "super_admin" && session.role !== "school_admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch the subject to ensure it exists and belongs to the user's school
    const subject = await prisma.subject.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Check if user has access to this subject's school
    if (session.schoolId !== subject.schoolId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get request data
    const data = await request.json();
    const { teacherIds } = data;

    if (!Array.isArray(teacherIds)) {
      return NextResponse.json(
        { error: "Teacher IDs must be an array" },
        { status: 400 }
      );
    }

    // Verify all provided teacher IDs exist and belong to this school
    if (teacherIds.length > 0) {
      const teachers = await prisma.teacher.findMany({
        where: {
          id: {
            in: teacherIds,
          },
          user: {
            schoolId: session.schoolId,
          },
        },
        select: {
          id: true,
        },
      });

      const validTeacherIds = teachers.map((t) => t.id);
      const invalidTeacherIds = teacherIds.filter(
        (id) => !validTeacherIds.includes(id)
      );

      if (invalidTeacherIds.length > 0) {
        return NextResponse.json(
          {
            error: `The following teacher IDs are invalid or don't belong to your school: ${invalidTeacherIds.join(
              ", "
            )}`,
          },
          { status: 400 }
        );
      }
    }

    // Update teacher assignments in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // First, remove all existing assignments
      await tx.subjectTeacher.deleteMany({
        where: {
          subjectId: params.id,
        },
      });

      // Create new assignments if any teacher IDs were provided
      if (teacherIds.length > 0) {
        await tx.subjectTeacher.createMany({
          data: teacherIds.map((teacherId) => ({
            subjectId: params.id,
            teacherId,
          })),
        });
      }

      // Fetch the updated assignments with teacher details
      const updatedAssignments = await tx.subjectTeacher.findMany({
        where: {
          subjectId: params.id,
        },
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  profileImage: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      return updatedAssignments;
    });

    // Format the response
    const formattedTeachers = result.map((st) => ({
      id: st.id,
      teacherId: st.teacherId,
      name: st.teacher.user.name,
      email: st.teacher.user.email,
      profileImage: st.teacher.user.profileImage,
      userId: st.teacher.user.id,
    }));

    return NextResponse.json({
      message: "Teacher assignments updated successfully",
      teachers: serializeBigInts(formattedTeachers),
      count: formattedTeachers.length,
    });
  } catch (error) {
    console.error("Error updating subject teacher assignments:", error);
    return NextResponse.json(
      { error: "Failed to update teacher assignments" },
      { status: 500 }
    );
  }
}
