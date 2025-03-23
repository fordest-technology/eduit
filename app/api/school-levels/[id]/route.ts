import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";

// Helper function to convert BigInt values to numbers for serialization
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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const level = await prisma.schoolLevel.findUnique({
      where: {
        id: params.id,
      },
      include: {
        _count: {
          select: {
            classes: true,
            subjects: true,
          },
        },
        classes: {
          include: {
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
            _count: {
              select: {
                students: true,
                subjects: true,
              },
            },
          },
        },
        subjects: {
          include: {
            _count: {
              select: {
                teachers: true,
                students: true,
              },
            },
          },
        },
      },
    });

    if (!level) {
      return NextResponse.json(
        { error: "School level not found" },
        { status: 404 }
      );
    }

    // Only allow access to the school's own levels
    if (session.role !== "super_admin" && level.schoolId !== session.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(level);
  } catch (error) {
    console.error("[SCHOOL_LEVEL_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only super admins and school admins can update
    if (!["super_admin", "school_admin"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, order } = body;

    // Check if level exists
    const level = await prisma.$queryRaw`
      SELECT *
      FROM "SchoolLevel"
      WHERE id = ${params.id}
    `;

    if (!(level as any[]).length) {
      return NextResponse.json(
        { error: "School level not found" },
        { status: 404 }
      );
    }

    const existingLevel = (level as any[])[0];

    // Check permissions
    if (
      session.role !== "super_admin" &&
      existingLevel.schoolId !== session.schoolId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If name is changing, check for uniqueness
    if (name && name !== existingLevel.name) {
      const nameExists = await prisma.$queryRaw`
        SELECT id
        FROM "SchoolLevel"
        WHERE "schoolId" = ${existingLevel.schoolId}
        AND name = ${name}
        AND id != ${params.id}
      `;

      if ((nameExists as any[]).length > 0) {
        return NextResponse.json(
          { error: "School level with this name already exists" },
          { status: 400 }
        );
      }
    }

    // Update the level
    const result = await prisma.$queryRaw`
      UPDATE "SchoolLevel"
      SET
        name = ${name || existingLevel.name},
        description = ${
          description !== undefined ? description : existingLevel.description
        },
        "order" = ${order !== undefined ? order : existingLevel.order},
        "updatedAt" = NOW()
      WHERE id = ${params.id}
      RETURNING *
    `;

    return NextResponse.json(serializeBigInts((result as any[])[0]));
  } catch (error) {
    console.error("[SCHOOL_LEVEL_PUT]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only super admins and school admins can delete
    if (!["super_admin", "school_admin"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if level exists
    const level = await prisma.$queryRaw`
      SELECT *
      FROM "SchoolLevel"
      WHERE id = ${params.id}
    `;

    if (!(level as any[]).length) {
      return NextResponse.json(
        { error: "School level not found" },
        { status: 404 }
      );
    }

    const existingLevel = (level as any[])[0];

    // Check permissions
    if (
      session.role !== "super_admin" &&
      existingLevel.schoolId !== session.schoolId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if level is in use by classes or subjects
    const classCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Class"
      WHERE "levelId" = ${params.id}
    `;

    const subjectCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Subject"
      WHERE "levelId" = ${params.id}
    `;

    const classCountNum = Number((classCount as any[])[0].count);
    const subjectCountNum = Number((subjectCount as any[])[0].count);

    if (classCountNum > 0 || subjectCountNum > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete level that is in use",
          details: {
            classCount: classCountNum,
            subjectCount: subjectCountNum,
          },
        },
        { status: 400 }
      );
    }

    // Delete the level
    await prisma.$queryRaw`
      DELETE FROM "SchoolLevel"
      WHERE id = ${params.id}
    `;

    return NextResponse.json(
      serializeBigInts({ success: true, id: params.id })
    );
  } catch (error) {
    console.error("[SCHOOL_LEVEL_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
