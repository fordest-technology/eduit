import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

// GET all school levels
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let levels;

    if (session.role === "super_admin") {
      // Super admin can see all levels or filter by schoolId if provided
      const { searchParams } = new URL(req.url);
      const schoolId = searchParams.get("schoolId");

      levels = await prisma.schoolLevel.findMany({
        where: schoolId ? { schoolId } : undefined,
        include: {
          _count: {
            select: {
              classes: true,
              subjects: true,
            },
          },
          classes: {
            include: {
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
          name: "asc",
        },
      });
    } else {
      // Other roles can only see levels from their school
      if (!session.schoolId) {
        return NextResponse.json(
          { error: "School ID not found in session" },
          { status: 400 }
        );
      }

      levels = await prisma.schoolLevel.findMany({
        where: {
          schoolId: session.schoolId,
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
          name: "asc",
        },
      });
    }

    return NextResponse.json(levels);
  } catch (error) {
    console.error("Error fetching school levels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST to create a new school level
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only super_admin and school_admin can create school levels
    if (session.role !== "super_admin" && session.role !== "school_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, schoolId } = body;

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: "Level name is required" },
        { status: 400 }
      );
    }

    // Determine the school ID
    const levelSchoolId = schoolId || session.schoolId;

    if (!levelSchoolId) {
      return NextResponse.json(
        { error: "School ID is required" },
        { status: 400 }
      );
    }

    // Check if a level with the same name already exists in the school
    const existingLevel = await prisma.schoolLevel.findFirst({
      where: {
        name,
        schoolId: levelSchoolId,
      },
    });

    if (existingLevel) {
      return NextResponse.json(
        { error: "A level with this name already exists in the school" },
        { status: 400 }
      );
    }

    // Create the level
    const newLevel = await prisma.schoolLevel.create({
      data: {
        name,
        description: description || null,
        schoolId: levelSchoolId,
      },
    });

    return NextResponse.json(newLevel);
  } catch (error) {
    console.error("Error creating school level:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
