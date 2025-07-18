import { getSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { mkdir } from "fs/promises";
import { cookies } from "next/headers";
import db from "@/lib/db";
import { uploadImage } from "@/lib/cloudinary";
import { generatePassword } from "@/lib/utils";

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
  const notInClassId = searchParams.get("notInClassId");

  try {
    const schoolId = session.schoolId;
    if (!schoolId) {
      return NextResponse.json(
        { message: "School not found" },
        { status: 404 }
      );
    }

    // Find the current academic session
    const currentSession = await db.academicSession.findFirst({
      where: {
        schoolId,
        isCurrent: true,
      },
    });

    if (!currentSession) {
      return NextResponse.json(
        { message: "No current academic session found" },
        { status: 404 }
      );
    }

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
    if (notInClassId && currentSession.id) {
      whereClause = {
        ...whereClause,
        NOT: {
          classes: {
            some: {
              classId: notInClassId,
              sessionId: currentSession.id,
            },
          },
        },
      };
    }

    const students = await db.student.findMany({
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
          where: {
            sessionId: currentSession.id,
            status: "ACTIVE",
          },
          include: {
            class: {
              select: {
                id: true,
                name: true,
                section: true,
                level: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            session: true,
          },
        },
        parents: {
          select: {
            parent: {
              select: {
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
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    if (!students) {
      return NextResponse.json(
        { message: "No students found" },
        { status: 404 }
      );
    }

    // Transform the data to include current class information
    const transformedStudents = students.map((student) => {
      // Get current class from the classes array (should only have current active class)
      const currentClass = student.classes.find((c) => c.status === "ACTIVE");

      return {
        id: student.id,
        name: student.user.name,
        email: student.user.email,
        profileImage: student.user.profileImage,
        rollNumber: currentClass?.rollNumber || "",
        classes: student.classes.map((sc) => ({
          id: sc.id,
          class: sc.class,
          status: sc.status,
          rollNumber: sc.rollNumber,
          session: sc.session,
        })),
        currentClass: currentClass
          ? {
              id: currentClass.class.id,
              name: currentClass.class.name,
              section: currentClass.class.section,
              level: currentClass.class.level,
              rollNumber: currentClass.rollNumber,
              status: currentClass.status,
            }
          : undefined,
        hasParents: student.parents.length > 0,
        parentNames: student.parents.map((p) => p.parent.user.name).join(", "),
      };
    });

    return NextResponse.json(transformedStudents);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { message: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // 1. Validate session and get school context
    const session = await getSession();
    if (!session?.schoolId) {
      return NextResponse.json(
        { message: "Unauthorized - Valid school session required" },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const phone = formData.get("phone") as string;
    const departmentId = formData.get("departmentId") as string;
    const classId = formData.get("classId") as string;
    const levelId = formData.get("levelId") as string;
    const sessionId = formData.get("sessionId") as string;
    const rollNumber = formData.get("rollNumber") as string;
    const profileImage = formData.get("profileImage") as File;
    const dateOfBirth = formData.get("dateOfBirth") as string;
    const gender = formData.get("gender") as string;
    const bloodGroup = formData.get("bloodGroup") as string;
    const religion = formData.get("religion") as string;
    const address = formData.get("address") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const country = formData.get("country") as string;

    // Validate required fields
    const validationErrors: Record<string, string> = {};

    if (!name?.trim()) {
      validationErrors.name = "Name is required";
    }
    if (!email?.trim()) {
      validationErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationErrors.email = "Please enter a valid email address";
    }
    if (!dateOfBirth) {
      validationErrors.dateOfBirth = "Date of birth is required";
    }
    if (!gender) {
      validationErrors.gender = "Gender is required";
    }
    if (!bloodGroup) {
      validationErrors.bloodGroup = "Blood group is required";
    }
    // Only require sessionId if classId is provided
    if (classId && !sessionId) {
      validationErrors.sessionId =
        "Academic session is required if assigning a class";
    }
    // Do NOT require classId

    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: validationErrors,
        },
        { status: 400 }
      );
    }

    // 3. Check for existing user in the same school
    const existingUser = await db.user.findFirst({
      where: {
        email: { equals: email.toLowerCase(), mode: "insensitive" },
        schoolId: session.schoolId,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "This email is already registered in your school" },
        { status: 400 }
      );
    }

    // 4. Get current academic session if not provided
    let targetSessionId = sessionId;
    if (!targetSessionId) {
      const currentSession = await db.academicSession.findFirst({
        where: {
          schoolId: session.schoolId,
          isCurrent: true,
        },
      });

      if (!currentSession) {
        return NextResponse.json(
          {
            message:
              "No active academic session found. Please set up an academic session first.",
          },
          { status: 400 }
        );
      }
      targetSessionId = currentSession.id;
    }

    // 5. Validate class if provided
    if (classId) {
      const classExists = await db.class.findFirst({
        where: {
          id: classId,
          schoolId: session.schoolId,
        },
      });

      if (!classExists) {
        return NextResponse.json(
          { message: "Selected class not found in your school" },
          { status: 400 }
        );
      }
    }

    // 6. Handle profile image upload if provided
    let profileImageUrl = null;
    if (profileImage) {
      try {
        // Convert File to base64
        const buffer = await profileImage.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const dataUrl = `data:${profileImage.type};base64,${base64}`;

        profileImageUrl = await uploadImage(dataUrl);
      } catch (error) {
        console.error("Failed to upload profile image:", error);
        return NextResponse.json(
          { message: "Failed to upload profile image" },
          { status: 500 }
        );
      }
    }

    // 7. Create user and student in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password: password || generatePassword(),
          role: UserRole.STUDENT,
          schoolId: session.schoolId,
          profileImage: profileImageUrl,
        },
      });

      // Create student
      const student = await tx.student.create({
        data: {
          userId: user.id,
          departmentId: departmentId || null,
          dateOfBirth: new Date(dateOfBirth),
          gender,
          bloodGroup,
          religion: religion?.trim() || null,
          address: address?.trim() || null,
          city: city?.trim() || null,
          state: state?.trim() || null,
          country: country?.trim() || null,
        },
      });

      // Only create class assignment if classId is specified
      if (classId) {
        await tx.studentClass.create({
          data: {
            studentId: student.id,
            classId: classId,
            sessionId: targetSessionId,
            rollNumber: rollNumber?.trim() || null,
          },
        });
      }

      // Return complete student data
      return await tx.student.findUnique({
        where: { id: student.id },
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
            where: { sessionId: targetSessionId },
            include: {
              class: {
                include: {
                  level: true,
                },
              },
            },
          },
          department: true,
        },
      });
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[STUDENTS_POST]", err);

    // Handle specific Prisma errors
    if (err && typeof err === "object" && "code" in err) {
      if (err.code === "P2002") {
        return NextResponse.json(
          { message: "A student with this email already exists" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { message: "Failed to create student. Please try again." },
      { status: 500 }
    );
  }
}
