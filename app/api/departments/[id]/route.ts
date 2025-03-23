import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
    const result: Record<string, any> = {};
    for (const key in data) {
      result[key] = serializeBigInts(data[key]);
    }
    return result;
  }

  return data;
}

// GET /api/departments/:id - fetch a specific department with its details
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

    // Get department data with counts
    const department = await prisma.department.findUnique({
      where: {
        id: departmentId,
        schoolId: session.schoolId,
      },
      include: {
        _count: {
          select: {
            students: true,
            subjects: true,
            teachers: true,
          },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    // Serialize BigInt values before returning
    return NextResponse.json(serializeBigInts(department));
  } catch (error) {
    console.error("Error fetching department:", error);
    return NextResponse.json(
      { error: "Failed to fetch department" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { name } = await request.json();

    if (!name) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const department = await prisma.department.update({
      where: {
        id: params.id,
      },
      data: {
        name,
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Serialize BigInt values before returning
    return NextResponse.json(serializeBigInts(department));
  } catch (error) {
    console.error("[DEPARTMENT_PUT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
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

    // Check if the department exists and belongs to the school
    const existingDepartment = await prisma.department.findUnique({
      where: {
        id: departmentId,
        schoolId: session.schoolId,
      },
      include: {
        _count: {
          select: {
            students: true,
            subjects: true,
            teachers: true,
          },
        },
      },
    });

    if (!existingDepartment) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    // Check if the department has any associated entities
    if (
      existingDepartment._count.students > 0 ||
      existingDepartment._count.subjects > 0 ||
      existingDepartment._count.teachers > 0
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot delete a department with associated students, subjects, or teachers",
        },
        { status: 400 }
      );
    }

    // Delete the department
    await prisma.department.delete({
      where: {
        id: departmentId,
      },
    });

    return NextResponse.json(
      { message: "Department deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting department:", error);
    return NextResponse.json(
      { error: "Failed to delete department" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const { name, description } = body;

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: "Department name is required" },
        { status: 400 }
      );
    }

    // Check if the department exists and belongs to the school
    const existingDepartment = await prisma.department.findUnique({
      where: {
        id: departmentId,
        schoolId: session.schoolId,
      },
    });

    if (!existingDepartment) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    // Update the department
    const updatedDepartment = await prisma.department.update({
      where: {
        id: departmentId,
      },
      data: {
        name,
        description,
      },
      include: {
        _count: {
          select: {
            students: true,
            subjects: true,
            teachers: true,
          },
        },
      },
    });

    // Serialize BigInt values before returning
    return NextResponse.json(serializeBigInts(updatedDepartment));
  } catch (error) {
    console.error("Error updating department:", error);
    return NextResponse.json(
      { error: "Failed to update department" },
      { status: 500 }
    );
  }
}
