import { getSession } from "@/lib/auth";
import { PrismaClient, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { mkdir } from "fs/promises";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const prisma = new PrismaClient();

  try {
    const schoolId = session.schoolId;
    if (!schoolId) {
      return NextResponse.json(
        { message: "School not found" },
        { status: 404 }
      );
    }

    // Get the current academic session
    const currentSession = await prisma.academicSession.findFirst({
      where: {
        schoolId,
        isCurrent: true,
      },
    });

    const parents = await prisma.user.findMany({
      where: {
        role: UserRole.PARENT,
        schoolId,
      },
      include: {
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
              include: {
                student: {
                  include: {
                    user: true,
                    classes: {
                      where: currentSession
                        ? {
                            sessionId: currentSession.id,
                          }
                        : undefined,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(parents);
  } catch (error) {
    console.error("Error fetching parents:", error);
    return NextResponse.json(
      { message: "Failed to fetch parents" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const schoolId = session.schoolId;
  if (!schoolId) {
    return NextResponse.json({ message: "School not found" }, { status: 404 });
  }

  // Only admin can create parents
  if (!["super_admin", "school_admin"].includes(session.role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const prisma = new PrismaClient();

  try {
    const formData = await request.formData();

    // Extract user fields
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const phone = formData.get("phone") as string | null;

    // Extract parent-specific fields
    const occupation = formData.get("occupation") as string;
    const alternatePhone = formData.get("alternatePhone") as string;
    const address = formData.get("address") as string;
    const state = formData.get("state") as string;
    const city = formData.get("city") as string;
    const country = formData.get("country") as string;

    // Basic validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email and password are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already in use" },
        { status: 400 }
      );
    }

    // Handle profile image upload if exists
    let profileImagePath = null;
    const profileImage = formData.get("profileImage") as File;

    if (profileImage && profileImage.size > 0) {
      try {
        const bytes = await profileImage.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create directory if it doesn't exist
        const uploadDir = join(process.cwd(), "public", "uploads", "parents");
        await mkdir(uploadDir, { recursive: true });

        // Generate unique filename
        const filename = `${randomUUID()}-${profileImage.name.replace(
          /\s/g,
          "_"
        )}`;
        const imagePath = join(uploadDir, filename);

        // Write file
        await writeFile(imagePath, buffer);

        // Store relative path in database
        profileImagePath = `/uploads/parents/${filename}`;
      } catch (error) {
        console.error("Error uploading image:", error);
        return NextResponse.json(
          { message: "Failed to upload profile image" },
          { status: 500 }
        );
      }
    }

    // Create parent with transaction to ensure everything is created together
    const result = await prisma.$transaction(async (tx) => {
      // Create the user record with parent profile
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password,
          role: UserRole.PARENT,
          schoolId,
          profileImage: profileImagePath,
          parent: {
            create: {
              occupation: occupation || null,
              phone: phone || null,
              alternatePhone: alternatePhone || null,
              address: address || null,
              city: city || null,
              state: state || null,
              country: country || null,
            },
          },
        },
        include: {
          parent: true,
        },
      });

      return newUser;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating parent:", error);
    return NextResponse.json(
      { message: "Failed to create parent" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
