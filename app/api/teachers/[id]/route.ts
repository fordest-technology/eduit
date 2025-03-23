import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const updateTeacherSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),
  departmentId: z.string().optional().nullable(),
  qualifications: z.string().optional().nullable(),
  specialization: z.string().optional().nullable(),
  employeeId: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!["super_admin", "school_admin"].includes(session.role)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Check if teacher exists and belongs to the same school
    const user = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: UserRole.TEACHER,
        schoolId: session.schoolId,
      },
      include: {
        teacher: true,
      },
    });

    if (!user) {
      return new NextResponse("Teacher not found", { status: 404 });
    }

    const body = await req.json();
    const validatedData = updateTeacherSchema.parse(body);

    // If email is being updated, check if it's not already in use
    if (validatedData.email && validatedData.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (existingUser) {
        return new NextResponse("Email already in use", { status: 400 });
      }
    }

    // Separate user data from teacher profile data
    const { name, email, ...teacherData } = validatedData;

    // Prepare update data
    const userData: any = {};
    if (name !== undefined) userData.name = name;
    if (email !== undefined) userData.email = email;

    const teacherProfileData: any = {};
    // Handle each field, supporting explicit null values
    teacherProfileData.phone = teacherData.phone;
    teacherProfileData.address = teacherData.address;
    teacherProfileData.gender = teacherData.gender;
    teacherProfileData.departmentId = teacherData.departmentId;
    teacherProfileData.qualifications = teacherData.qualifications;
    teacherProfileData.specialization = teacherData.specialization;
    teacherProfileData.employeeId = teacherData.employeeId;

    if (teacherData.dateOfBirth) {
      teacherProfileData.dateOfBirth = new Date(teacherData.dateOfBirth);
    } else if (teacherData.dateOfBirth === null) {
      teacherProfileData.dateOfBirth = null;
    }

    teacherProfileData.city = teacherData.city;
    teacherProfileData.state = teacherData.state;
    teacherProfileData.country = teacherData.country;

    // Perform updates in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the user record
      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: params.id },
          data: userData,
        });
      }

      // Update or create teacher profile
      if (Object.keys(teacherProfileData).length > 0) {
        if (user.teacher) {
          await tx.teacher.update({
            where: { id: user.teacher.id },
            data: teacherProfileData,
          });
        } else {
          await tx.teacher.create({
            data: {
              ...teacherProfileData,
              userId: user.id,
            },
          });
        }
      }

      // Return the updated user with teacher profile
      return tx.user.findUnique({
        where: { id: params.id },
        include: { teacher: true },
      });
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error updating teacher:", error);
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 });
    }
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!["super_admin", "school_admin"].includes(session.role)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Check if teacher exists and belongs to the same school
    const user = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: UserRole.TEACHER,
        schoolId: session.schoolId,
      },
      include: {
        teacher: true,
      },
    });

    if (!user) {
      return new NextResponse("Teacher not found", { status: 404 });
    }

    // Delete in a transaction
    await prisma.$transaction(async (tx) => {
      // If teacher profile exists
      if (user.teacher) {
        // First remove teacher from classes
        await tx.class.updateMany({
          where: { teacherId: user.teacher.id },
          data: { teacherId: null },
        });

        // Remove teacher-subject relationships
        await tx.subjectTeacher.deleteMany({
          where: { teacherId: user.teacher.id },
        });
      }

      // Delete the user (will cascade delete teacher profile)
      await tx.user.delete({
        where: { id: params.id },
      });
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting teacher:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Find the teacher with all related information
    const teacher = await prisma.teacher.findUnique({
      where: {
        id: params.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            createdAt: true,
            updatedAt: true,
            role: true,
          },
        },
        department: true,
        classes: true,
        subjects: {
          include: {
            subject: {
              include: {
                department: true,
                level: true,
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { message: "Teacher not found" },
        { status: 404 }
      );
    }

    // Format the response data
    const formattedTeacher = {
      id: teacher.id,
      userId: teacher.user.id,
      name: teacher.user.name,
      email: teacher.user.email,
      phone: teacher.phone || "",
      department: teacher.department?.name || "No Department",
      departmentId: teacher.departmentId,
      qualifications: teacher.qualifications || "",
      specialization: teacher.specialization || "",
      address: teacher.address || "",
      city: teacher.city || "",
      state: teacher.state || "",
      country: teacher.country || "",
      dateOfBirth: teacher.dateOfBirth,
      gender: teacher.gender || "",
      joiningDate: teacher.joiningDate,
      employeeId: teacher.employeeId || "",
      createdAt: teacher.user.createdAt,
      updatedAt: teacher.user.updatedAt,
      role: teacher.user.role,
      profileImage: teacher.user.profileImage,
      teacherClasses: teacher.classes,
      teacherSubjects: teacher.subjects.map((ts) => ({
        id: ts.id,
        subjectId: ts.subjectId,
        subject: ts.subject,
      })),
    };

    return NextResponse.json(formattedTeacher);
  } catch (error) {
    console.error("[TEACHER_GET]", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
