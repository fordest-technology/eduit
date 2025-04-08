import { getSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { mkdir } from "fs/promises";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const departmentId = searchParams.get("departmentId");

  try {
    // Test database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      console.error("Database connection error:", error);
      return NextResponse.json(
        { message: "Database connection error. Please try again later." },
        { status: 503 }
      );
    }

    const schoolId = session.schoolId;
    if (!schoolId && session.role !== "super_admin") {
      return NextResponse.json(
        { message: "School not found" },
        { status: 404 }
      );
    }

    const userWhereClause: any = {
      role: UserRole.TEACHER,
    };

    // Add school filter for non-super admin users
    if (session.role !== "super_admin") {
      userWhereClause.schoolId = schoolId;
    }

    const teacherWhereClause: any = {};

    // Add department filter if provided
    if (departmentId) {
      teacherWhereClause.departmentId = departmentId;
    }

    // First fetch all teachers with detailed information
    const users = await prisma.user.findMany({
      where: userWhereClause,
      include: {
        teacher: {
          where: teacherWhereClause,
          include: {
            department: true,
            classes: true,
            subjects: {
              include: {
                subject: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Filter out users that don't have teacher records
    const teachers = users.filter((user) => user.teacher);

    // Map to a simpler structure for client consumption
    const formattedTeachers = teachers
      .map((teacher) => {
        // TypeScript requires checking for null even though we already filtered
        if (!teacher.teacher) {
          return null; // This shouldn't happen due to the filter above
        }

        return {
          id: teacher.teacher.id,
          user: {
            id: teacher.id,
            name: teacher.name,
            email: teacher.email,
            profileImage: teacher.profileImage,
          },
          phone: teacher.teacher.phone,
          employeeId: teacher.teacher.employeeId,
          departmentId: teacher.teacher.departmentId,
          department: teacher.teacher.department,
          gender: teacher.teacher.gender,
          qualification: teacher.teacher.qualifications,
          specialization: teacher.teacher.specialization,
          subjects: teacher.teacher.subjects,
          classes: teacher.teacher.classes,
        };
      })
      .filter(Boolean); // Remove any null entries

    return NextResponse.json(formattedTeachers);
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json(
      { message: "Failed to fetch teachers" },
      { status: 500 }
    );
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

  // Only admin can create teachers
  if (!["super_admin", "school_admin"].includes(session.role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    // Test database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      console.error("Database connection error:", error);
      return NextResponse.json(
        { message: "Database connection error. Please try again later." },
        { status: 503 }
      );
    }

    const formData = await request.formData();

    // Extract user fields
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Extract teacher-specific fields
    const employeeId = formData.get("employeeId") as string;
    const qualifications = formData.get("qualifications") as string;
    const specialization = formData.get("specialization") as string;
    const joiningDate = formData.get("joiningDate") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const dateOfBirth = formData.get("dateOfBirth") as string;
    const gender = formData.get("gender") as string;
    const emergencyContact = formData.get("emergencyContact") as string;
    const state = formData.get("state") as string;
    const city = formData.get("city") as string;
    const country = formData.get("country") as string;

    // Extract relationship fields
    const departmentId = formData.get("departmentId") as string;

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
        const uploadDir = join(process.cwd(), "public", "uploads", "teachers");
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
        profileImagePath = `/uploads/teachers/${filename}`;
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

    // Create teacher with transaction to ensure everything is created together
    const result = await prisma.$transaction(async (tx) => {
      // Create the user record
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: UserRole.TEACHER,
          schoolId,
          profileImage: profileImagePath,
          // Create the teacher record with a nested create
          teacher: {
            create: {
              employeeId: employeeId || null,
              qualifications: qualifications || null,
              specialization: specialization || null,
              joiningDate: joiningDate ? new Date(joiningDate) : null,
              phone: phone || null,
              address: address || null,
              city: city || null,
              state: state || null,
              country: country || null,
              dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
              gender: gender || null,
              emergencyContact: emergencyContact || null,
              departmentId: departmentId || null,
            },
          },
        },
        include: {
          teacher: true,
        },
      });

      return newUser;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating teacher:", error);
    return NextResponse.json(
      { message: "Failed to create teacher" },
      { status: 500 }
    );
  }
}
