import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { UserRole } from "@prisma/client";
import * as z from "zod";

const classesAssignmentSchema = z.object({
  classIds: z.array(z.string()),
});

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

// GET: Fetch classes assigned to a subject
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
    if (
      session.role !== UserRole.SUPER_ADMIN &&
      session.schoolId !== subject.schoolId
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch classes assigned to this subject
    const subjectClasses = await prisma.classSubject.findMany({
      where: {
        subjectId: params.id,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            section: true,
          },
        },
      },
    });

    return NextResponse.json(serializeBigInts(subjectClasses));
  } catch (error) {
    console.error("Error fetching subject classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
}

// PUT: Update class assignments for a subject
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

    // Only admins can assign classes
    if (
      session.role !== UserRole.SUPER_ADMIN &&
      session.role !== UserRole.SCHOOL_ADMIN
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get and validate request data
    const data = await request.json();
    const validationResult = classesAssignmentSchema.safeParse(data);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error },
        { status: 400 }
      );
    }

    const { classIds } = validationResult.data;

    // Fetch the subject to ensure it exists and belongs to the school
    const subject = await prisma.subject.findUnique({
      where: {
        id: params.id,
      },
      select: {
        id: true,
        schoolId: true,
      },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Check if user has access to this subject's school
    if (
      session.role !== UserRole.SUPER_ADMIN &&
      session.schoolId !== subject.schoolId
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Verify all classes exist and belong to the school
    const classes = await prisma.class.findMany({
      where: {
        id: {
          in: classIds,
        },
        schoolId: session.schoolId,
      },
    });

    if (classes.length !== classIds.length) {
      return NextResponse.json(
        {
          error:
            "One or more classes not found or belong to a different school",
        },
        { status: 400 }
      );
    }

    // Start a transaction to update class assignments
    const result = await prisma.$transaction(async (tx) => {
      // Remove existing assignments
      await tx.classSubject.deleteMany({
        where: {
          subjectId: params.id,
        },
      });

      // Create new assignments
      const newAssignments = await Promise.all(
        classIds.map((classId) =>
          tx.classSubject.create({
            data: {
              subjectId: params.id,
              classId: classId,
            },
            include: {
              class: {
                select: {
                  id: true,
                  name: true,
                  section: true,
                },
              },
            },
          })
        )
      );

      return newAssignments;
    });

    return NextResponse.json(serializeBigInts(result));
  } catch (error) {
    console.error("Error updating class assignments:", error);
    return NextResponse.json(
      { error: "Failed to update class assignments" },
      { status: 500 }
    );
  }
}
