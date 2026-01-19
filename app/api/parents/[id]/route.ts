import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { join } from "path";
import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";

// GET a specific parent
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Find the parent with their profile and children - optimized query
    const parent = await prisma.user.findUnique({
      where: {
        id,
        role: UserRole.PARENT,
      },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        schoolId: true,
        createdAt: true,
        parent: {
          select: {
            id: true,
            phone: true,
            alternatePhone: true,
            occupation: true,
            address: true,
            city: true,
            state: true,
            country: true,
            children: {
              select: {
                id: true,
                relation: true,
                isPrimary: true,
                student: {
                  select: {
                    id: true,
                    user: {
                      select: {
                        id: true,
                        name: true,
                        profileImage: true,
                      },
                    },
                    classes: {
                      take: 1,
                      select: {
                        class: {
                          select: {
                            name: true,
                          },
                        },
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
      session.role === UserRole.SCHOOL_ADMIN &&
      parent.schoolId !== session.schoolId
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Get all students not linked to any parent - optimized query
    const availableStudents = await prisma.user.findMany({
      where: {
        role: UserRole.STUDENT,
        schoolId: parent.schoolId,
        student: {
          parents: {
            none: {}, // This ensures we only get students not linked to any parent
          },
        },
      },
      select: {
        id: true,
        name: true,
        profileImage: true,
        student: {
          select: {
            id: true,
            classes: {
              take: 1,
              select: {
                class: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      take: 100, // Limit to 100 students for performance
    });

    // Format available students
    const formattedAvailableStudents = availableStudents.map((student) => {
      const currentClass =
        student.student?.classes && student.student.classes.length > 0
          ? student.student.classes[0].class.name
          : "No Class Assigned";

      return {
        id: student.student?.id || "",
        name: student.name,
        class: currentClass,
        profileImage: student.profileImage,
      };
    });

    // Format children data
    const children =
      parent.parent?.children.map((relation) => ({
        id: relation.id,
        studentId: relation.student.id,
        student: {
          id: relation.student.id,
          name: relation.student.user.name,
          class: relation.student.classes[0]?.class?.name || "Not assigned",
          profileImage: relation.student.user.profileImage,
        },
        relation: relation.relation,
        isPrimary: relation.isPrimary,
      })) || [];

    // Create response with formatted data
    const response = NextResponse.json({
      id: parent.id,
      name: parent.name,
      email: parent.email,
      profileImage: parent.profileImage,
      phone: parent.parent?.phone,
      alternatePhone: parent.parent?.alternatePhone,
      occupation: parent.parent?.occupation,
      address: parent.parent?.address,
      city: parent.parent?.city,
      state: parent.parent?.state,
      country: parent.parent?.country,
      createdAt: parent.createdAt,
      children,
      availableStudents: formattedAvailableStudents,
    });

    // Add cache headers - short cache time since this data might change
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=30, stale-while-revalidate=60"
    );

    return response;
  } catch (error) {
    // Only log in development
    if (process.env.NODE_ENV !== "production") {
      console.error("[PARENT_GET]", error);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}

// Update parent info
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    if (
      !session ||
      !([UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN] as UserRole[]).includes(
        session.role
      )
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Find the parent with their profile - optimized query
    const parent = await prisma.user.findUnique({
      where: {
        id,
        role: UserRole.PARENT,
      },
      select: {
        id: true,
        email: true,
        schoolId: true,
        parent: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!parent) {
      return new NextResponse("Parent not found", { status: 404 });
    }

    // If school_admin, check if the parent belongs to their school
    if (
      session.role === UserRole.SCHOOL_ADMIN &&
      parent.schoolId !== session.schoolId
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const formData = await request.formData();

    // Extract data from form
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string | null;
    const alternatePhone = formData.get("alternatePhone") as string | null;
    const occupation = formData.get("occupation") as string | null;
    const address = formData.get("address") as string | null;
    const city = formData.get("city") as string | null;
    const state = formData.get("state") as string | null;
    const country = formData.get("country") as string | null;
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
        select: {
          id: true,
        },
      });

      if (existingUser && existingUser.id !== id) {
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
        // Only log in development
        if (process.env.NODE_ENV !== "production") {
          console.error("[PARENT_UPDATE_IMAGE_UPLOAD]", error);
        }
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
          id: id,
        },
        data: userUpdateData,
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          role: true,
          schoolId: true,
          parent: {
            select: {
              id: true,
            },
          },
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
            alternatePhone: alternatePhone || null,
            occupation: occupation || null,
            address: address || null,
            city: city || null,
            state: state || null,
            country: country || null,
          },
        });
      }

      return updatedUser;
    });

    // Create response with formatted data
    const response = NextResponse.json({
      id: result.id,
      name: result.name,
      email: result.email,
      profileImage: result.profileImage,
      role: result.role,
      schoolId: result.schoolId,
    });

    // Add cache control headers
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate"
    );

    return response;
  } catch (error) {
    // Only log in development
    if (process.env.NODE_ENV !== "production") {
      console.error("[PARENT_UPDATE]", error);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}

// Delete parent
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    if (
      !session ||
      !([UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN] as UserRole[]).includes(
        session.role
      )
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Find the parent - optimized query
    const parent = await prisma.user.findUnique({
      where: {
        id,
        role: UserRole.PARENT,
      },
      select: {
        id: true,
        schoolId: true,
      },
    });

    if (!parent) {
      return new NextResponse("Parent not found", { status: 404 });
    }

    // If school_admin, check if the parent belongs to their school
    if (
      session.role === UserRole.SCHOOL_ADMIN &&
      parent.schoolId !== session.schoolId
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Delete all parent-student relationships first
    await prisma.studentParent.deleteMany({
      where: { parentId: id },
    });

    // Delete the parent
    await prisma.user.delete({
      where: {
        id: id,
      },
    });

    // Create response with cache headers
    const response = new NextResponse(null, { status: 204 });
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate"
    );

    return response;
  } catch (error) {
    // Only log in development
    if (process.env.NODE_ENV !== "production") {
      console.error("[PARENT_DELETE]", error);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}
