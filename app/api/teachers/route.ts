import { getSession } from "@/lib/auth";
import { UserRole, Department } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { mkdir } from "fs/promises";

interface TeacherData {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
  phone: string | null;
  employeeId: string | null;
  qualifications: string | null;
  specialization: string | null;
  joiningDate: Date | null;
  departmentId: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  dateOfBirth: Date | null;
  gender: string | null;
  emergencyContact: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
  };
  department?: Department;
  stats: {
    totalClasses: number;
    totalStudents: number;
    totalSubjects: number;
  };
  subjects: Array<{
    id: string;
    name: string;
    code: string;
    department: Department;
  }>;
  classes: Array<{
    id: string;
    name: string;
    section: string;
    level: {
      id: string;
      name: string;
    };
    studentCount: number;
  }>;
}

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
    // Allow both super_admin and school_admin to access
    if (
      !schoolId &&
      session.role !== UserRole.SUPER_ADMIN &&
      session.role !== UserRole.SCHOOL_ADMIN
    ) {
      return NextResponse.json(
        { message: "School not found" },
        { status: 404 }
      );
    }

    const userWhereClause: any = {
      role: UserRole.TEACHER,
    };

    // Add school filter for non-super admin users
    if (session.role !== UserRole.SUPER_ADMIN) {
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
            classes: {
              include: {
                level: true,
                students: {
                  where: {
                    status: "ACTIVE",
                  },
                },
              },
            },
            subjects: {
              include: {
                subject: {
                  include: {
                    department: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Filter out users that don't have teacher records
    const teachers = users.filter((user) => user.teacher);

    // Map to a simpler structure for client consumption
    const formattedTeachers = teachers
      .map((teacher) => {
        if (!teacher.teacher) return null;

        const activeClasses = teacher.teacher.classes.filter((cls) =>
          cls.students.some((student) => student.status === "ACTIVE")
        );

        return {
          id: teacher.teacher.id,
          name: teacher.name,
          email: teacher.email,
          profileImage: teacher.profileImage,
          phone: teacher.teacher.phone,
          employeeId: teacher.teacher.employeeId,
          qualifications: teacher.teacher.qualifications,
          specialization: teacher.teacher.specialization,
          joiningDate: teacher.teacher.joiningDate,
          departmentId: teacher.teacher.departmentId,
          address: teacher.teacher.address,
          city: teacher.teacher.city,
          state: teacher.teacher.state,
          country: teacher.teacher.country,
          dateOfBirth: teacher.teacher.dateOfBirth,
          gender: teacher.teacher.gender,
          emergencyContact: teacher.teacher.emergencyContact,
          createdAt: teacher.teacher.createdAt,
          updatedAt: teacher.teacher.updatedAt,
          user: {
            id: teacher.id,
            name: teacher.name,
            email: teacher.email,
            profileImage: teacher.profileImage,
          },
          department: teacher.teacher.department,
          subjects: teacher.teacher.subjects.map((s) => ({
            id: s.subject.id,
            name: s.subject.name,
            code: s.subject.code,
            department: s.subject.department,
          })),
          classes: activeClasses.map((c) => ({
            id: c.id,
            name: c.name,
            section: c.section,
            level: c.level,
            studentCount: c.students.length,
          })),
          stats: {
            totalSubjects: teacher.teacher.subjects.length,
            totalClasses: activeClasses.length,
            totalStudents: activeClasses.reduce(
              (sum, cls) => sum + cls.students.length,
              0
            ),
          },
        };
      })
      .filter(Boolean) as TeacherData[];

    // Calculate total stats
    const uniqueSubjects = new Set(
      formattedTeachers.flatMap((teacher) => teacher.subjects.map((s) => s.id))
    );
    const uniqueDepartments = new Set(
      formattedTeachers.map((teacher) => teacher.departmentId).filter(Boolean)
    );
    const totalActiveClasses = formattedTeachers.reduce(
      (sum, teacher) => sum + teacher.stats.totalClasses,
      0
    );
    const totalActiveStudents = formattedTeachers.reduce(
      (sum, teacher) => sum + teacher.stats.totalStudents,
      0
    );
    const teachersWithClasses = formattedTeachers.filter(
      (teacher) => teacher.stats.totalClasses > 0
    ).length;

    return NextResponse.json({
      teachers: formattedTeachers,
      stats: {
        total: formattedTeachers.length,
        subjects: uniqueSubjects.size,
        departments: uniqueDepartments.size,
        withClasses: teachersWithClasses,
        activeStudents: totalActiveStudents,
        activeClasses: totalActiveClasses,
      },
    });
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
  if (
    session.role !== UserRole.SUPER_ADMIN &&
    session.role !== UserRole.SCHOOL_ADMIN
  ) {
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
