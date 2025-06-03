import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { eventTrack } from "@/lib/events";
import { UserRole } from "@prisma/client";
import * as z from "zod";

// Validation schema for department creation
const createDepartmentSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters"),
  description: z.string().optional().nullable(),
});

// GET /api/departments - fetch departments for current school
export async function GET(req: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schoolId = session.schoolId;

  if (!schoolId) {
    return NextResponse.json(
      { error: "No school associated with account" },
      { status: 400 }
    );
  }

  try {
    const departments = await prisma.department.findMany({
      where: {
        schoolId,
      },
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: {
            subjects: true,
            students: true,
            teachers: true,
          },
        },
      },
    });

    return NextResponse.json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json(
      { error: "Failed to fetch departments" },
      { status: 500 }
    );
  }
}

// POST /api/departments - create a new department
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      session.role !== UserRole.SUPER_ADMIN &&
      session.role !== UserRole.SCHOOL_ADMIN
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const schoolId = session.schoolId;

    if (!schoolId) {
      return NextResponse.json(
        { error: "No school associated with account" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = createDepartmentSchema.parse(body);

    // Check if department with same name already exists in this school
    const existingDepartment = await prisma.department.findFirst({
      where: {
        name: validatedData.name,
        schoolId,
      },
    });

    if (existingDepartment) {
      return NextResponse.json(
        { error: "A department with this name already exists" },
        { status: 400 }
      );
    }

    // Create the department
    const department = await prisma.department.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        schoolId,
      },
      include: {
        _count: {
          select: {
            subjects: true,
            students: true,
            teachers: true,
          },
        },
      },
    });

    eventTrack("department_created", {
      userId: session.id,
      schoolId,
      departmentId: department.id,
    });

    return NextResponse.json(department);
  } catch (error) {
    console.error("Error creating department:", error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create department" },
      { status: 500 }
    );
  }
}

// PATCH /api/departments/:id - update a department
export async function PATCH(req: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    session.role !== UserRole.SUPER_ADMIN &&
    session.role !== UserRole.SCHOOL_ADMIN
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const schoolId = session.schoolId;

  if (!schoolId) {
    return NextResponse.json(
      { error: "No school associated with account" },
      { status: 400 }
    );
  }

  try {
    const { id, name, description } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Department ID is required" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "Department name is required" },
        { status: 400 }
      );
    }

    // Check if department exists and belongs to this school
    const existingDepartment = await prisma.department.findUnique({
      where: {
        id,
        schoolId,
      },
    });

    if (!existingDepartment) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    // Check if another department with the same name exists
    const duplicateNameDepartment = await prisma.department.findFirst({
      where: {
        name,
        schoolId,
        id: {
          not: id,
        },
      },
    });

    if (duplicateNameDepartment) {
      return NextResponse.json(
        { error: "Another department with this name already exists" },
        { status: 400 }
      );
    }

    const department = await prisma.department.update({
      where: {
        id,
      },
      data: {
        name,
        description,
      },
    });

    eventTrack("department_updated", {
      userId: session.id,
      schoolId,
      departmentId: department.id,
    });

    return NextResponse.json(department);
  } catch (error) {
    console.error("Error updating department:", error);
    return NextResponse.json(
      { error: "Failed to update department" },
      { status: 500 }
    );
  }
}

// DELETE /api/departments/:id - delete a department
export async function DELETE(req: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    session.role !== UserRole.SUPER_ADMIN &&
    session.role !== UserRole.SCHOOL_ADMIN
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const schoolId = session.schoolId;

  if (!schoolId) {
    return NextResponse.json(
      { error: "No school associated with account" },
      { status: 400 }
    );
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Department ID is required" },
      { status: 400 }
    );
  }

  try {
    // Check if department exists and belongs to this school
    const existingDepartment = await prisma.department.findUnique({
      where: {
        id,
        schoolId,
      },
      include: {
        _count: {
          select: {
            subjects: true,
            students: true,
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
      existingDepartment._count.subjects > 0 ||
      existingDepartment._count.students > 0 ||
      existingDepartment._count.teachers > 0
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot delete a department with associated subjects, students, or teachers",
        },
        { status: 400 }
      );
    }

    await prisma.department.delete({
      where: {
        id,
      },
    });

    eventTrack("department_deleted", {
      userId: session.id,
      schoolId,
      departmentId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting department:", error);
    return NextResponse.json(
      { error: "Failed to delete department" },
      { status: 500 }
    );
  }
}
