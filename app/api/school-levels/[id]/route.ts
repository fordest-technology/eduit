import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { z } from "zod";

// Schema for level update
const levelSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  order: z.number().int().min(0).optional(),
});

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

// GET a specific level
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request);

    if (!auth.authenticated || !auth.user || !auth.user.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const level = await prisma.schoolLevel.findUnique({
      where: {
        id: params.id,
        schoolId: auth.user.schoolId,
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
                    email: true,
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
            department: true,
          },
        },
      },
    });

    if (!level) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
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

// PUT to update a level
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const body = await request.json();

    // Validate request body
    const validatedData = levelSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.errors[0].message },
        { status: 400 }
      );
    }

    // Check if level exists and belongs to the school
    const existingLevel = await prisma.schoolLevel.findUnique({
      where: {
        id: params.id,
        schoolId: user.schoolId,
      },
    });

    if (!existingLevel) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }

    // Check if another level with the same name exists
    const duplicateLevel = await prisma.schoolLevel.findFirst({
      where: {
        id: { not: params.id },
        schoolId: user.schoolId,
        name: validatedData.data.name,
      },
    });

    if (duplicateLevel) {
      return NextResponse.json(
        { error: "A level with this name already exists" },
        { status: 400 }
      );
    }

    // Update the level
    const updatedLevel = await prisma.schoolLevel.update({
      where: {
        id: params.id,
      },
      data: validatedData.data,
      include: {
        _count: {
          select: {
            classes: true,
            subjects: true,
          },
        },
      },
    });

    return NextResponse.json(updatedLevel);
  } catch (error) {
    console.error("[SCHOOL_LEVEL_PUT]", error);
    return NextResponse.json(
      { error: "Failed to update school level" },
      { status: 500 }
    );
  }
}

// DELETE a level
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Check if level exists and belongs to the school
    const level = await prisma.schoolLevel.findUnique({
      where: {
        id: params.id,
        schoolId: user.schoolId,
      },
      include: {
        _count: {
          select: {
            classes: true,
            subjects: true,
          },
        },
      },
    });

    if (!level) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }

    // Check if level has any classes or subjects
    if (level._count.classes > 0 || level._count.subjects > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete level with associated classes or subjects",
        },
        { status: 400 }
      );
    }

    // Delete the level
    await prisma.schoolLevel.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: "Level deleted successfully" });
  } catch (error) {
    console.error("[SCHOOL_LEVEL_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete school level" },
      { status: 500 }
    );
  }
}
