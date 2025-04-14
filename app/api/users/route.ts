import { type NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/db";
import { Database } from "@/lib/db/index";
import { getSession } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";
import { UserRole } from "@prisma/client";
import { sendTeacherCredentialsEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (
    !session ||
    (session.role !== UserRole.SUPER_ADMIN &&
      session.role !== UserRole.SCHOOL_ADMIN)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const schoolId =
      session.role === UserRole.SUPER_ADMIN
        ? searchParams.get("schoolId") || undefined
        : session.schoolId;

    const where: any = {};
    if (role) {
      where.role = role.toUpperCase() as UserRole;
    }
    if (schoolId) {
      where.schoolId = schoolId;
    }

    const users = await Database.query(() =>
      prisma.user.findMany({
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
      })
    );

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

    if (!name || !email || !password || !role) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const finalSchoolId = session.schoolId;
    if (
      session.role === UserRole.SUPER_ADMIN &&
      role !== UserRole.SUPER_ADMIN
    ) {
      return new NextResponse("School ID is required for this user role", {
        status: 400,
      });
    }

    const existingUser = await Database.query(() =>
      prisma.user.findUnique({
        where: { email },
        select: { id: true },
      })
    );

    if (existingUser) {
      return new NextResponse("Email already in use", { status: 400 });
    }

    const hashedPassword = await hash(password, 10);

    const school = await Database.query(() =>
      prisma.school.findUnique({
        where: { id: finalSchoolId },
        select: { name: true, subdomain: true },
      })
    );

    if (!school) {
      return new NextResponse("School not found", { status: 400 });
    }

    const userData: any = {
      name,
      email,
      password: hashedPassword,
      role,
      schoolId: finalSchoolId,
      profileImage,
    };

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

    const user = await Database.query(() =>
      prisma.user.create({
        data: userData,
        include: {
          teacher: true,
          student: true,
          parent: true,
          admin: true,
        },
      })
    );

    if (role === UserRole.TEACHER) {
      await sendTeacherCredentialsEmail({
        email,
        password,
        name,
        schoolName: school.name,
        schoolUrl: `https://${school.subdomain}.yourdomain.com`,
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
