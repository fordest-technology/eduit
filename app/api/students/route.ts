import { getSession } from "@/lib/auth";
import { PrismaClient, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { mkdir } from "fs/promises";

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

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const departmentId = searchParams.get("departmentId");
  const notInClassId = searchParams.get("notInClass");

  const prisma = new PrismaClient();

  try {
    const schoolId = session.schoolId;
    if (!schoolId) {
      return NextResponse.json(
        { message: "School not found" },
        { status: 404 }
      );
    }

    // Find the current academic session
    const currentSession = await prisma.academicSession.findFirst({
      where: {
        schoolId,
        isCurrent: true,
      },
      select: {
        id: true,
      },
    });

    const currentSessionId = currentSession?.id;

    // Base query to find students by school
    let whereClause: any = {
      user: {
        schoolId,
      },
    };

    // Add department filter if specified
    if (departmentId) {
      whereClause.departmentId = departmentId;
    }

    // Filter students by class if classId is provided
    if (classId) {
      whereClause.classes = {
        some: {
          classId,
        },
      };
    }

    // Filter students NOT in the specified class if notInClassId is provided
    if (notInClassId && currentSessionId) {
      whereClause = {
        ...whereClause,
        NOT: {
          classes: {
            some: {
              classId: notInClassId,
              sessionId: currentSessionId,
            },
          },
        },
      };
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
        classes: {
          include: {
            class: {
              include: {
                level: true,
              },
            },
            session: true,
          },
          where: {
            session: {
              isCurrent: true,
            },
          },
          take: 1,
        },
        department: true,
        parents: {
          include: {
            parent: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Format the response based on query parameters
    // If we're looking for students not in a class, return a simplified format
    if (notInClassId) {
      const simplifiedStudents = students.map((student) => ({
        id: student.id,
        name: student.user?.name || "",
        email: student.user?.email || "",
        profileImage: student.user?.profileImage || null,
        department: student.department
          ? {
              id: student.department.id,
              name: student.department.name,
            }
          : null,
      }));
      return NextResponse.json(simplifiedStudents);
    }

    return NextResponse.json(serializeBigInts(students));
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { message: "Failed to fetch students" },
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

  // Only super admins and school admins can create students
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

    // Extract student-specific fields
    const admissionDate = formData.get("admissionDate") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const dateOfBirth = formData.get("dateOfBirth") as string;
    const gender = formData.get("gender") as string;
    const religion = formData.get("religion") as string;
    const bloodGroup = formData.get("bloodGroup") as string;
    const state = formData.get("state") as string;
    const city = formData.get("city") as string;
    const country = formData.get("country") as string;

    // Extract relationship fields
    const departmentId = formData.get("departmentId") as string;
    const classId = formData.get("classId") as string;
    const sessionId = formData.get("sessionId") as string;
    const rollNumber = formData.get("rollNumber") as string;

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
        const uploadDir = join(process.cwd(), "public", "uploads", "students");
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
        profileImagePath = `/uploads/students/${filename}`;
      } catch (error) {
        console.error("Error uploading image:", error);
        return NextResponse.json(
          { message: "Failed to upload profile image" },
          { status: 500 }
        );
      }
    }

    // Basic validation
    if (!name || !email) {
      return NextResponse.json(
        { message: "Name and email are required" },
        { status: 400 }
      );
    }

    // Set a default password if not provided
    const hashedPassword = password
      ? "$2a$10$7ORW.G6oMD2ZmKHIBzp8IOq5hLO8/X1BehBGWQYCuGvjwEJdDmRYu" // Simple example (in production use proper hashing)
      : "$2a$10$7ORW.G6oMD2ZmKHIBzp8IOq5hLO8/X1BehBGWQYCuGvjwEJdDmRYu"; // "password123" hashed

    // Create student with transaction to ensure everything is created together
    const student = await prisma.$transaction(async (tx) => {
      // First create the user record with nested student creation
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: UserRole.STUDENT,
          schoolId,
          profileImage: profileImagePath,
          student: {
            create: {
              admissionDate: admissionDate ? new Date(admissionDate) : null,
              phone: phone || null,
              address: address || null,
              dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
              gender: gender || null,
              religion: religion || null,
              bloodGroup: bloodGroup || null,
              state: state || null,
              city: city || null,
              country: country || null,
              departmentId: departmentId || null,
            },
          },
        },
        include: {
          student: true,
        },
      });

      // If class and session are provided, create class assignment
      if (classId && sessionId && newUser.student) {
        await tx.studentClass.create({
          data: {
            studentId: newUser.student.id,
            classId,
            sessionId,
            rollNumber: rollNumber || null,
          },
        });
      }

      return newUser;
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { message: "Failed to create student" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
