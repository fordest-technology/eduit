import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { z } from "zod";

// Schema for level creation/update
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

// GET all levels for a school
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    if (!auth.authenticated || !auth.user || !auth.user.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const levels = await prisma.schoolLevel.findMany({
      where: {
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
          select: {
            _count: {
              select: {
                students: true,
                subjects: true,
              },
            },
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });

    return NextResponse.json(levels);
  } catch (error) {
    console.error("[SCHOOL_LEVELS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST to create a new level
export async function POST(request: NextRequest) {
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

    // Check if level with same name exists
    const existingLevel = await prisma.schoolLevel.findFirst({
      where: {
        schoolId: user.schoolId,
        name: validatedData.data.name,
      },
    });

    if (existingLevel) {
      return NextResponse.json(
        { error: "A level with this name already exists" },
        { status: 400 }
      );
    }

    // Create the level
    const level = await prisma.schoolLevel.create({
      data: {
        ...validatedData.data,
        schoolId: user.schoolId ?? "",
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

    return NextResponse.json(level);
  } catch (error) {
    console.error("[SCHOOL_LEVEL_POST]", error);
    return NextResponse.json(
      { error: "Failed to create school level" },
      { status: 500 }
    );
  }
}
