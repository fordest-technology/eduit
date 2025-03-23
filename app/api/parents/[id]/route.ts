import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { join } from "path";
import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";

// GET a specific parent
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Find the parent with their profile and children
    const parent = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: UserRole.PARENT,
      },
      include: {
        parent: {
          include: {
            children: {
              include: {
                student: {
                  include: {
                    user: true,
                    classes: {
                      include: {
                        class: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!parent) {
      return new NextResponse("Parent not found", { status: 404 });
    }

    // If school_admin, check if the parent belongs to their school
    if (
      session.role === "school_admin" &&
      parent.schoolId !== session.schoolId
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Format children data
    const children =
      parent.parent?.children.map((relation) => ({
        id: relation.id,
        studentId: relation.student.id,
        student: {
          id: relation.student.id,
          name: relation.student.user.name,
          class: relation.student.classes[0]?.class?.name || "Not assigned",
        },
      })) || [];

    // Remove password before returning
    const { password, ...parentWithoutPassword } = parent;

    return NextResponse.json({
      ...parentWithoutPassword,
      children,
    });
  } catch (error) {
    console.error("[PARENT_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// Update parent info
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session || !["super_admin", "school_admin"].includes(session.role)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Find the parent with their profile
    const parent = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: UserRole.PARENT,
      },
      include: {
        parent: true,
      },
    });

    if (!parent) {
      return new NextResponse("Parent not found", { status: 404 });
    }

    // If school_admin, check if the parent belongs to their school
    if (
      session.role === "school_admin" &&
      parent.schoolId !== session.schoolId
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const formData = await request.formData();

    // Extract data from form
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string | null;
    const profileImageFile = formData.get("profileImage") as File | null;

    // Basic validation
    if (!name || !email) {
      return new NextResponse("Name and email are required", { status: 400 });
    }

    // Check if email exists and belongs to another user
    if (email !== parent.email) {
      const existingUser = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (existingUser && existingUser.id !== params.id) {
        return new NextResponse("Email already in use by another user", {
          status: 400,
        });
      }
    }

    // Prepare update data for user
    const userUpdateData: any = {
      name,
      email,
    };

    // Only update password if provided
    if (password && password.trim() !== "") {
      userUpdateData.password = password;
    }

    // Upload profile image if provided
    if (profileImageFile && profileImageFile.size > 0) {
      try {
        const arrayBuffer = await profileImageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Create directory if it doesn't exist
        const uploadDir = join(process.cwd(), "public", "uploads", "parents");
        await mkdir(uploadDir, { recursive: true });

        // Generate unique filename
        const filename = `${randomUUID()}-${profileImageFile.name.replace(
          /\s/g,
          "_"
        )}`;
        const imagePath = join(uploadDir, filename);

        // Write file
        await writeFile(imagePath, buffer);

        // Store relative path in database
        userUpdateData.profileImage = `/uploads/parents/${filename}`;
      } catch (error) {
        console.error("[PARENT_UPDATE_IMAGE_UPLOAD]", error);
        return new NextResponse("Failed to upload profile image", {
          status: 500,
        });
      }
    }

    // Update both user and parent profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user data
      const updatedUser = await tx.user.update({
        where: {
          id: params.id,
        },
        data: userUpdateData,
        include: {
          parent: true,
        },
      });

      if (parent.parent) {
        // Update parent profile data
        await tx.parent.update({
          where: {
            id: parent.parent.id,
          },
          data: {
            phone: phone || null,
          },
        });
      }

      return updatedUser;
    });

    // Remove password from response
    const { password: _, ...parentWithoutPassword } = result;

    return NextResponse.json(parentWithoutPassword);
  } catch (error) {
    console.error("[PARENT_UPDATE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// Delete parent
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session || !["super_admin", "school_admin"].includes(session.role)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Find the parent
    const parent = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: UserRole.PARENT,
      },
    });

    if (!parent) {
      return new NextResponse("Parent not found", { status: 404 });
    }

    // If school_admin, check if the parent belongs to their school
    if (
      session.role === "school_admin" &&
      parent.schoolId !== session.schoolId
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Delete all parent-student relationships first
    await prisma.studentParent.deleteMany({
      where: {
        parentId: params.id,
      },
    });

    // Delete the parent
    await prisma.user.delete({
      where: {
        id: params.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[PARENT_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
