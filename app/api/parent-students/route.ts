import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
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

    // Check authorization - only admins can link parents and students
    if (session.role !== "super_admin" && session.role !== "school_admin") {
      return new NextResponse(
        JSON.stringify({
          error: "You do not have permission to perform this action",
        }),
        { status: 403 }
      );
    }

    // Get the request body
    const body = await req.json();
    const { parentId, studentIds, relation } = body;

    // Validate the required data
    if (
      !parentId ||
      !studentIds ||
      !Array.isArray(studentIds) ||
      studentIds.length === 0
    ) {
      return new NextResponse(
        JSON.stringify({
          error:
            "Invalid request data. Parent ID and student IDs are required.",
        }),
        { status: 400 }
      );
    }

    // Check if the parent exists and is a parent
    const parentUser = await prisma.user.findUnique({
      where: {
        id: parentId,
        role: "PARENT",
      },
      include: {
        parent: true,
      },
    });

    if (!parentUser) {
      return new NextResponse(JSON.stringify({ error: "Parent not found" }), {
        status: 404,
      });
    }

    if (!parentUser.parent) {
      return new NextResponse(
        JSON.stringify({
          error:
            "Parent profile not found. Please ensure the parent profile is properly set up.",
        }),
        { status: 404 }
      );
    }

    const parentProfileId = parentUser.parent.id;

    // Check if the user has permission to link this parent
    // School admins can only manage parents in their school
    if (
      session.role === "school_admin" &&
      parentUser.schoolId !== session.schoolId
    ) {
      return new NextResponse(
        JSON.stringify({
          error: "You do not have permission to manage this parent",
        }),
        { status: 403 }
      );
    }

    // Verify all students exist and belong to the same school as the parent
    const students = await prisma.user.findMany({
      where: {
        id: { in: studentIds },
        role: "STUDENT",
        schoolId: parentUser.schoolId,
      },
      include: {
        student: true,
      },
    });

    if (students.length !== studentIds.length) {
      return new NextResponse(
        JSON.stringify({
          error:
            "One or more students do not exist or belong to a different school",
        }),
        { status: 400 }
      );
    }

    // Filter out students without student profiles
    const validStudents = students.filter(
      (student) => student.student !== null
    );

    if (validStudents.length !== students.length) {
      return new NextResponse(
        JSON.stringify({
          error: "Some selected students do not have proper student profiles",
        }),
        { status: 400 }
      );
    }

    // Create connections between parent and students
    const results = await Promise.all(
      validStudents.map(async (student) => {
        // Check if relationship already exists
        const existingRelation = await prisma.studentParent.findFirst({
          where: {
            studentId: student.student!.id,
            parentId: parentProfileId,
          },
        });

        if (existingRelation) {
          // Update relation if it exists and a new relation value is provided
          if (relation !== undefined) {
            return prisma.studentParent.update({
              where: { id: existingRelation.id },
              data: { relation },
            });
          }
          return existingRelation;
        }

        // Create new relation if it doesn't exist
        return prisma.studentParent.create({
          data: {
            studentId: student.student!.id,
            parentId: parentProfileId,
            relation,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      message: `${results.length} student(s) linked to parent successfully`,
      count: results.length,
    });
  } catch (error) {
    console.error("Error linking students to parent:", error);
    return new NextResponse(
      JSON.stringify({
        error: "An error occurred while linking students to parent",
      }),
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
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

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get("parentId");

    // Validate required parameters
    if (!parentId) {
      return new NextResponse(
        JSON.stringify({ error: "Parent ID is required" }),
        { status: 400 }
      );
    }

    // Check if the parent exists
    const parentUser = await prisma.user.findUnique({
      where: {
        id: parentId,
        role: "PARENT",
      },
      include: {
        parent: true,
      },
    });

    if (!parentUser) {
      return new NextResponse(JSON.stringify({ error: "Parent not found" }), {
        status: 404,
      });
    }

    if (!parentUser.parent) {
      return new NextResponse(
        JSON.stringify({
          error: "Parent profile not found",
        }),
        { status: 404 }
      );
    }

    const parentProfileId = parentUser.parent.id;

    // Check authorization
    if (
      session.role !== "super_admin" &&
      session.role !== "school_admin" &&
      session.role !== "teacher" &&
      session.id !== parentId
    ) {
      return new NextResponse(
        JSON.stringify({
          error: "You do not have permission to access this information",
        }),
        { status: 403 }
      );
    }

    // School admins and teachers can only view parents in their school
    if (
      (session.role === "school_admin" || session.role === "teacher") &&
      parentUser.schoolId !== session.schoolId
    ) {
      return new NextResponse(
        JSON.stringify({
          error: "You do not have permission to access this information",
        }),
        { status: 403 }
      );
    }

    // Get current session
    const currentSession = parentUser.schoolId
      ? await prisma.academicSession.findFirst({
          where: {
            schoolId: parentUser.schoolId,
            isCurrent: true,
          },
        })
      : null;

    // Get all linked students for this parent
    const linkedStudents = await prisma.studentParent.findMany({
      where: {
        parentId: parentProfileId,
      },
      include: {
        student: {
          include: {
            user: true,
            classes: {
              where: currentSession
                ? {
                    sessionId: currentSession.id,
                  }
                : undefined,
              include: {
                class: true,
              },
            },
          },
        },
      },
    });

    // Format the response
    const formattedLinkedStudents = linkedStudents.map((link) => {
      // Get class information
      const currentClass =
        link.student.classes && link.student.classes.length > 0
          ? link.student.classes[0].class.name
          : "No Class Assigned";

      return {
        id: link.student.id,
        name: link.student.user?.name || "Unknown",
        linkId: link.id,
        relation: link.relation || "Not specified",
        class: currentClass,
      };
    });

    return NextResponse.json({
      students: formattedLinkedStudents,
    });
  } catch (error) {
    console.error("Error fetching linked students:", error);
    return new NextResponse(
      JSON.stringify({
        error: "An error occurred while fetching linked students",
      }),
      { status: 500 }
    );
  }
}
