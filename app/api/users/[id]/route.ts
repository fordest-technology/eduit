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
      session.role !== "super_admin" &&
      session.role !== "school_admin" &&
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
        ...(session.role === "school_admin" || session.role === "super_admin"
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
    const { name, email, password, role, schoolId } = body;

    // Check if user has permission to update this user
    if (
      session.role !== "super_admin" &&
      (session.role !== "school_admin" || session.id === userId)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = await hash(password, 10);

    // Only super_admin can change roles and school assignments
    if (session.role === "super_admin") {
      if (role) updateData.role = role.toUpperCase();
      if (schoolId) updateData.schoolId = schoolId;
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
    (session.role !== "super_admin" && session.role !== "school_admin")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = params.id;

    // Check if user has permission to delete this user
    if (session.role === "school_admin") {
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
