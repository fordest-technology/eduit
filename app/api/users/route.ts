import { type NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs"; // Changed from bcrypt to bcryptjs
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";
import { UserRole } from "@prisma/client";
import { sendTeacherCredentialsEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (
    !session ||
    (session.role !== "super_admin" && session.role !== "school_admin")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const schoolId =
      session.role === "super_admin"
        ? searchParams.get("schoolId") || undefined
        : session.schoolId;

    // Create the where object with proper typing for role
    const where: any = {};

    // Only add role to filter if it exists, and make sure it's properly typed as an enum
    if (role) {
      where.role = role.toUpperCase() as UserRole;
    }

    // Add schoolId to filter if it exists
    if (schoolId) {
      where.schoolId = schoolId;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        schoolId: true,
        profileImage: true,
        createdAt: true,
        teacher: {
          select: {
            phone: true,
            gender: true,
            dateOfBirth: true,
            address: true,
            country: true,
            city: true,
            state: true,
            qualifications: true,
            specialization: true,
            employeeId: true,
            departmentId: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
        student: {
          select: {
            phone: true,
            gender: true,
            dateOfBirth: true,
            address: true,
            country: true,
            city: true,
            state: true,
            religion: true,
            bloodGroup: true,
          },
        },
        school: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as UserRole;
    const profileImage = formData.get("profileImage") as string;

    // Get role-specific data
    const teacherData = formData.get("teacherData")
      ? JSON.parse(formData.get("teacherData") as string)
      : null;
    const studentData = formData.get("studentData")
      ? JSON.parse(formData.get("studentData") as string)
      : null;
    const parentData = formData.get("parentData")
      ? JSON.parse(formData.get("parentData") as string)
      : null;
    const adminData = formData.get("adminData")
      ? JSON.parse(formData.get("adminData") as string)
      : null;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Determine school ID based on user role
    const finalSchoolId = session.schoolId;
    if (session.role === "super_admin" && role !== UserRole.SUPER_ADMIN) {
      return new NextResponse("School ID is required for this user role", {
        status: 400,
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return new NextResponse("Email already in use", { status: 400 });
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Get school info for email
    const school = await prisma.school.findUnique({
      where: { id: finalSchoolId },
      select: { name: true, subdomain: true },
    });

    if (!school) {
      return new NextResponse("School not found", { status: 400 });
    }

    // Create user with role-specific data
    const userData: any = {
      name,
      email,
      password: hashedPassword,
      role,
      schoolId: finalSchoolId,
      profileImage,
    };

    // Add nested create for specific user type
    if (role === UserRole.TEACHER && teacherData) {
      userData.teacher = {
        create: {
          phone: teacherData.phone,
          gender: teacherData.gender,
          dateOfBirth: teacherData.dateOfBirth
            ? new Date(teacherData.dateOfBirth)
            : undefined,
          address: teacherData.address,
          city: teacherData.city,
          state: teacherData.state,
          country: teacherData.country,
          qualifications: teacherData.qualifications,
          specialization: teacherData.specialization,
          employeeId: teacherData.employeeId,
        },
      };
    } else if (role === UserRole.STUDENT && studentData) {
      userData.student = {
        create: {
          phone: studentData.phone,
          gender: studentData.gender,
          dateOfBirth: studentData.dateOfBirth
            ? new Date(studentData.dateOfBirth)
            : undefined,
          address: studentData.address,
          city: studentData.city,
          state: studentData.state,
          country: studentData.country,
          religion: studentData.religion,
          bloodGroup: studentData.bloodGroup,
        },
      };
    } else if (role === UserRole.PARENT && parentData) {
      userData.parent = {
        create: {
          phone: parentData.phone,
          alternatePhone: parentData.alternatePhone,
          occupation: parentData.occupation,
          address: parentData.address,
          city: parentData.city,
          state: parentData.state,
          country: parentData.country,
        },
      };
    } else if (
      (role === UserRole.SCHOOL_ADMIN || role === UserRole.SUPER_ADMIN) &&
      adminData
    ) {
      userData.admin = {
        create: {
          adminType: adminData.adminType,
          permissions: adminData.permissions,
        },
      };
    }

    // Create user with nested data
    const user = await prisma.user.create({
      data: userData,
      include: {
        teacher: true,
        student: true,
        parent: true,
        admin: true,
      },
    });

    // Send email with credentials
    if (role === UserRole.TEACHER) {
      await sendTeacherCredentialsEmail({
        name,
        email,
        password,
        schoolName: school.name,
        schoolUrl: `https://${school.subdomain}.yourdomain.com`,
      });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("[USERS_POST]", error);
    // Improved error handling for database constraint violations
    if (error.code === "P2002") {
      // Check which field caused the unique constraint violation
      const target = error.meta?.target;
      if (target && target.includes("email")) {
        return new NextResponse("Email address already exists in the system", {
          status: 400,
        });
      }
      return new NextResponse("A unique constraint was violated", {
        status: 400,
      });
    }

    // Handle validation errors
    if (
      error.name === "ValidationError" ||
      error.message.includes("validation")
    ) {
      return new NextResponse(`Validation error: ${error.message}`, {
        status: 400,
      });
    }

    // Handle network errors when sending email
    if (error.message?.includes("email") || error.message?.includes("SMTP")) {
      // Still create the user but log the email sending failure
      console.error("User created but failed to send email:", error);
      return new NextResponse("User created but failed to send welcome email", {
        status: 201,
      });
    }

    return new NextResponse(error.message || "An unexpected error occurred", {
      status: 500,
    });
  }
}
