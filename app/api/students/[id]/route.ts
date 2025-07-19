import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { uploadImage } from "@/lib/cloudinary";

// GET a specific student
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Fetch student with all necessary relations including level data
    const studentData = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        department: true,
        classes: {
          include: {
            class: {
              include: {
                level: true, // Include level data
              },
            },
            session: true,
          },
          orderBy: {
            session: {
              endDate: "desc", // Order by most recent session first
            },
          },
        },
        subjects: {
          include: {
            subject: true,
          },
        },
        parents: {
          include: {
            parent: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!studentData) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to view this student
    if (
      session.role === UserRole.SCHOOL_ADMIN &&
      session.schoolId !== studentData.user.schoolId
    ) {
      return NextResponse.json(
        { message: "Unauthorized to view this student" },
        { status: 403 }
      );
    }

    // Find current session for this school
    const currentSession = await prisma.academicSession.findFirst({
      where: {
        schoolId: studentData.user.schoolId || "",
        isCurrent: true,
      },
    });

    // Get current class for this student in the current session
    let currentClass = null;
    let currentClassRecord = null;

    if (currentSession && studentData.classes.length > 0) {
      // Try to find class for current session
      currentClassRecord = studentData.classes.find(
        (sc) => sc.sessionId === currentSession.id
      );

      // If no class found for current session, use the most recent class
      if (!currentClassRecord && studentData.classes.length > 0) {
        currentClassRecord = studentData.classes[0]; // Already ordered by most recent
      }

      if (currentClassRecord) {
        // Include the roll number from studentClass in the class object
        currentClass = {
          ...currentClassRecord.class,
          rollNumber: currentClassRecord.rollNumber,
          session: currentClassRecord.session,
        };
      }
    }

    // Fetch all departments for the school
    const availableDepartments = await prisma.department.findMany({
      where: {
        schoolId: studentData.user.schoolId || "",
      },
    });

    // Fetch all classes for the school
    const availableClasses = await prisma.class.findMany({
      where: {
        schoolId: studentData.user.schoolId || "",
      },
      include: {
        level: true, // Include level data
      },
    });

    // Fetch all available subjects for the school
    const availableSubjects = await prisma.subject.findMany({
      where: {
        schoolId: studentData.user.schoolId || "",
      },
    });

    // Fetch all parents in the school
    const availableParents = await prisma.parent.findMany({
      where: {
        user: {
          schoolId: studentData.user.schoolId || "",
        },
      },
      select: {
        id: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Prepare data for the form
    const formData = {
      id: studentData.id,
      userId: studentData.userId,
      name: studentData.user.name,
      email: studentData.user.email,
      phone: studentData.phone,
      profileImage: studentData.user.profileImage,
      schoolId: studentData.user.schoolId,
      departmentId: studentData.departmentId,
      address: studentData.address,
      city: studentData.city,
      state: studentData.state,
      country: studentData.country,
      dateOfBirth: studentData.dateOfBirth,
      gender: studentData.gender,
      religion: studentData.religion,
      bloodGroup: studentData.bloodGroup,
      subjectIds: studentData.subjects.map((s) => s.subject.id),
      parentIds: studentData.parents.map((p) => p.parent.id),
      currentClass: currentClass,
      currentSession: currentSession,
      classId: currentClassRecord?.classId,
      sessionId: currentClassRecord?.sessionId,
      rollNumber: currentClassRecord?.rollNumber,
      classes: studentData.classes, // Include all classes

      // Add formatted data for display
      subjects: studentData.subjects.map((s) => s.subject),
      parents: studentData.parents.map((p) => ({
        id: p.parent.id,
        name: p.parent.user.name,
        email: p.parent.user.email,
        phone: p.parent.user.phone,
        relation: p.relation,
      })),
    };

    // Format the response with all available data
    const responseData = {
      student: formData,
      availableDepartments,
      availableClasses,
      availableSubjects,
      availableParents: availableParents.map((p) => ({
        id: p.id,
        name: p.user.name,
        email: p.user.email,
      })),
      currentSession,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching student data:", error);
    return NextResponse.json(
      { message: "Failed to fetch student data" },
      { status: 500 }
    );
  }
}

// PATCH to update a student
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check permission to update student
    if (
      session.role !== UserRole.SUPER_ADMIN &&
      session.role !== UserRole.SCHOOL_ADMIN &&
      session.role !== UserRole.TEACHER
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const formData = await request.formData();
    const studentData: Record<string, any> = {};
    const userUpdateData: Record<string, any> = {};

    // First, check if student exists
    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!student) {
      return new NextResponse("Student not found", { status: 404 });
    }

    // Extract all fields from form data and separate user and student fields
    for (const [key, value] of formData.entries()) {
      if (key === "profileImage") {
        continue; // Handle separately
      }

      // Special handling for specific fields
      if (["name", "email", "phone"].includes(key)) {
        userUpdateData[key] = value || undefined;
      } else if (key === "departmentId") {
        // Only include departmentId if it's a non-empty string
        if (value && value !== "") {
          // Verify the department exists
          const departmentExists = await prisma.department.findUnique({
            where: { id: value.toString() },
          });

          if (departmentExists) {
            studentData.departmentId = value.toString();
          }
        } else if (value === "") {
          // If empty string, set to null (if the field is nullable)
          studentData.departmentId = null;
        }
      } else if (key === "dateOfBirth" && value) {
        // Handle date conversion
        studentData.dateOfBirth = new Date(value.toString());
      } else if (
        key !== "classId" &&
        key !== "sessionId" &&
        key !== "rollNumber"
      ) {
        // Skip class-related fields (handled separately)
        if (value !== "") {
          studentData[key] = value;
        } else {
          studentData[key] = null;
        }
      }
    }

    console.log("Student data to update:", studentData);
    console.log("User data to update:", userUpdateData);

    // Process profile image if provided
    const profileImageFile = formData.get("profileImage") as string;
    if (profileImageFile && profileImageFile !== student.user.profileImage) {
      try {
        const imageUrl = await uploadImage(profileImageFile);
        userUpdateData.profileImage = imageUrl;
      } catch (error) {
        console.error("Failed to upload image:", error);
        return new NextResponse("Failed to upload image", { status: 500 });
      }
    }

    // Update user data (associated with the student)
    const updatedUser = await prisma.user.update({
      where: {
        id: student.userId,
      },
      data: userUpdateData,
    });

    // Update student data
    const updatedStudent = await prisma.student.update({
      where: {
        id: params.id,
      },
      data: studentData,
      include: {
        user: true,
        department: true,
      },
    });

    // Handle class assignment if provided
    const classId = formData.get("classId") as string;
    const sessionId = formData.get("sessionId") as string;

    if (classId && sessionId) {
      // Check if the student already has this class for this session
      const existingClass = await prisma.studentClass.findFirst({
        where: {
          studentId: params.id,
          sessionId: sessionId,
        },
      });

      if (existingClass) {
        // Update existing record
        await prisma.studentClass.update({
          where: {
            id: existingClass.id,
          },
          data: {
            classId,
            rollNumber: (formData.get("rollNumber") as string) || null,
          },
        });
      } else {
        // Create a new record
        await prisma.studentClass.create({
          data: {
            studentId: params.id,
            classId,
            sessionId,
            rollNumber: (formData.get("rollNumber") as string) || null,
          },
        });
      }
    }

    // Combine the user and student data for the response
    const result = {
      ...updatedStudent,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      profileImage: updatedUser.profileImage,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[STUDENT_UPDATE]", error);
    return new NextResponse(
      `Internal error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      { status: 500 }
    );
  }
}

// DELETE a student
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check if student exists and user has permission
    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 }
      );
    }

    if (
      session.user.role === "school_admin" &&
      session.user.schoolId !== student.user.schoolId
    ) {
      return NextResponse.json(
        { message: "Unauthorized to delete this student" },
        { status: 403 }
      );
    }

    // Delete student and related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete related records first
      await tx.studentSubject.deleteMany({
        where: { studentId: params.id },
      });

      await tx.studentParent.deleteMany({
        where: { studentId: params.id },
      });

      await tx.studentClass.deleteMany({
        where: { studentId: params.id },
      });

      // Delete student and user
      await tx.student.delete({
        where: { id: params.id },
      });

      await tx.user.delete({
        where: { id: student.userId },
      });
    });

    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check if student exists and user has permission
    const existingStudent = await prisma.student.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 }
      );
    }

    // Check permission to update student
    if (
      session.role === "school_admin" &&
      session.schoolId !== existingStudent.user.schoolId
    ) {
      return NextResponse.json(
        { message: "Unauthorized to update this student" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      email,
      phone,
      departmentId,
      address,
      city,
      state,
      country,
      dateOfBirth,
      gender,
      religion,
      bloodGroup,
      subjectIds,
      parentIds,
      classId,
      sessionId,
      rollNumber,
      profileImage,
    } = body;

    // Update student and related data in a transaction
    const updatedStudent = await prisma.$transaction(async (tx) => {
      // Update user data
      const updatedUser = await tx.user.update({
        where: { id: existingStudent.userId },
        data: {
          name,
          email,
          phone,
          profileImage,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profileImage: true,
          schoolId: true,
          createdAt: true,
        },
      });

      // Update student data
      const updatedStudent = await tx.student.update({
        where: { id: params.id },
        data: {
          departmentId,
          address,
          city,
          state,
          country,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender,
          religion,
          bloodGroup,
        },
        include: {
          user: true,
          department: true,
        },
      });

      // Update subjects
      if (subjectIds && Array.isArray(subjectIds)) {
        // Delete existing subject assignments
        await tx.studentSubject.deleteMany({
          where: { studentId: params.id },
        });

        // Create new subject assignments
        if (subjectIds.length > 0) {
          await tx.studentSubject.createMany({
            data: subjectIds.map((subjectId: string) => ({
              studentId: params.id,
              subjectId,
            })),
          });
        }
      }

      // Update parents
      if (parentIds && Array.isArray(parentIds)) {
        // Delete existing parent relationships
        await tx.studentParent.deleteMany({
          where: { studentId: params.id },
        });

        // Create new parent relationships
        if (parentIds.length > 0) {
          await tx.studentParent.createMany({
            data: parentIds.map((parentId: string) => ({
              studentId: params.id,
              parentId,
              relation: "Parent", // Default relation, can be updated later
            })),
          });
        }
      }

      // Update class assignment if provided
      if (classId && sessionId) {
        // Check if student already has a class in this session
        const existingClassRecord = await tx.studentClass.findFirst({
          where: {
            studentId: params.id,
            sessionId,
          },
        });

        if (existingClassRecord) {
          // Update existing record
          await tx.studentClass.update({
            where: { id: existingClassRecord.id },
            data: {
              classId,
              rollNumber: rollNumber || null,
            },
          });
        } else {
          // Create new record
          await tx.studentClass.create({
            data: {
              studentId: params.id,
              classId,
              sessionId,
              rollNumber: rollNumber || null,
            },
          });
        }
      }

      // Return full student data with relations
      const fullStudentData = await tx.student.findUnique({
        where: { id: params.id },
        include: {
          user: true,
          department: true,
          studentClass: {
            include: {
              class: true,
              session: true,
            },
          },
          subjects: {
            include: {
              subject: true,
            },
          },
          parents: {
            include: {
              parent: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      return fullStudentData;
    });

    return NextResponse.json({
      message: "Student updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
