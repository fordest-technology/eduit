import { type NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = params.id;

    // Check if user has permission to view this user
    if (
      session.role !== "SUPER_ADMIN" &&
      session.role !== "SCHOOL_ADMIN" &&
      session.id !== userId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        schoolId: true,
        createdAt: true,
        school: {
          select: {
            name: true,
          },
        },
        // Include relevant relations based on role
        ...(session.role === "SCHOOL_ADMIN" || session.role === "SUPER_ADMIN"
          ? {
            teacherClasses: {
              select: {
                id: true,
                name: true,
              },
            },
            teacherSubjects: {
              select: {
                id: true,
                subject: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            admin: {
              select: {
                adminType: true,
                permissions: true,
              },
            },
          }
          : {}),
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = params.id;
    const body = await request.json();
    const { name, email, password, role, schoolId, adminData } = body;

    // Check if user has permission to update this user
    if (
      session.role !== "SUPER_ADMIN" &&
      (session.role !== "SCHOOL_ADMIN" || session.id === userId)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = await hash(password, 10);

    // Only SUPER_ADMIN can change roles and school assignments
    if (session.role === "SUPER_ADMIN") {
      if (role) updateData.role = role.toUpperCase();
      if (schoolId) updateData.schoolId = schoolId;
    }

    // Handle Admin data (permissions)
    if (adminData) {
      updateData.admin = {
        upsert: {
          create: {
            adminType: adminData.adminType || 'SCHOOL_ADMIN',
            permissions: adminData.permissions,
          },
          update: {
            adminType: adminData.adminType,
            permissions: adminData.permissions,
          },
        },
      };
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        schoolId: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();

  if (
    !session ||
    (session.role !== "SUPER_ADMIN" && session.role !== "SCHOOL_ADMIN")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = params.id;

    // Check if user has permission to delete this user
    if (session.role === "SCHOOL_ADMIN") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { schoolId: true },
      });

      if (!user || user.schoolId !== session.schoolId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
