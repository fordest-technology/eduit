import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { hash } from "bcryptjs";
import { generatePassword } from "@/lib/utils";
import { sendStudentCredentialsEmail } from "@/lib/email";

// Validation schema for linking student
const linkStudentSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  relation: z.string().min(1, "Relation is required"),
  isPrimary: z.boolean().optional().default(false),
});

// Validation schema for creating and linking a new student
const createStudentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  classId: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dateOfBirth: z.string().optional(), // Expecting ISO string
  relation: z.string().min(1, "Relation is required"),
  isPrimary: z.boolean().optional().default(false),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`[API_PARENTS_STUDENTS] POST hit for parent user id: ${id}`);
  
  try {
    const session = await getSession();
    if (!session) {
      console.log(`[API_PARENTS_STUDENTS] No session found`);
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }
    
    const isAuthorized = 
        session.role === UserRole.SUPER_ADMIN ||
        session.role === UserRole.SCHOOL_ADMIN ||
        session.role === UserRole.TEACHER;

    if (!isAuthorized) {
      console.log(`[API_PARENTS_STUDENTS] Unauthorized role: ${session.role}`);
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Get the parent user record along with the parent profile
    const parentUser = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        name: true,
        schoolId: true,
        parent: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!parentUser) {
      console.log(`[API_PARENTS_STUDENTS] Parent user not found for ID: ${id}`);
      return NextResponse.json({ message: `Parent record not found (ID: ${id})` }, { status: 404 });
    }
    
    if (parentUser.role !== UserRole.PARENT || !parentUser.parent) {
      console.log(`[API_PARENTS_STUDENTS] User ${id} found but is not a parent or missing profile. Role: ${parentUser.role}`);
      return NextResponse.json({ message: "Target user is not a parent or missing parent profile" }, { status: 404 });
    }

    // If school_admin, check if the parent belongs to their school
    if (session.role === UserRole.SCHOOL_ADMIN && parentUser.schoolId !== session.schoolId) {
       console.log(`[API_PARENTS_STUDENTS] School mismatch. User school: ${parentUser.schoolId}, Admin school: ${session.schoolId}`);
      return NextResponse.json({ message: "Forbidden: Parent belongs to another school" }, { status: 403 });
    }

    // Validate request body
    const body = await request.json();
    const isLinking = "studentId" in body && body.studentId;
    const isCreating = body.action === "create";

    let studentIdToLink: string;
    let relation: string;
    let isPrimary: boolean;

    if (isLinking) {
        const validatedData = linkStudentSchema.parse(body);
        console.log(`[API_PARENTS_STUDENTS] Linking existing student attempt for ID: ${validatedData.studentId}`);
        
        // Try looking up as Student Record ID (Student.id) first
        const studentRecord = await db.student.findUnique({
             where: { id: validatedData.studentId },
             include: { user: true }
        });

        if (studentRecord) {
            console.log(`[API_PARENTS_STUDENTS] Found student record by Student.id: ${studentRecord.id}`);
            studentIdToLink = studentRecord.id;
        } else {
            // Fallback: Try looking up as User Record ID (User.id)
            const userWithStudent = await db.user.findUnique({
                where: { id: validatedData.studentId },
                include: { student: true }
            });

            if (userWithStudent && userWithStudent.student) {
                console.log(`[API_PARENTS_STUDENTS] Found student record by User.id: ${userWithStudent.student.id}`);
                studentIdToLink = userWithStudent.student.id;
            } else if (userWithStudent && !userWithStudent.student && userWithStudent.role === UserRole.STUDENT) {
                // This is the "broken record" case we found - User exists as STUDENT but has no Student profile
                console.error(`[API_PARENTS_STUDENTS] CRITICAL: User ${validatedData.studentId} is a STUDENT but has no Student profile record.`);
                return NextResponse.json({ 
                    message: "This student record is incomplete in the database. Please contact support to repair the student profile." 
                }, { status: 400 });
            } else {
                 console.log(`[API_PARENTS_STUDENTS] Student not found for ID: ${validatedData.studentId}`);
                 return NextResponse.json({ message: "Student record not found" }, { status: 404 });
            }
        }

        relation = validatedData.relation;
        isPrimary = validatedData.isPrimary;
    } else if (isCreating) {
        // Explicit Creation flow...
        const validatedData = createStudentSchema.parse(body);
        console.log(`[API_PARENTS_STUDENTS] Creating new student: ${validatedData.name}`);
        
        relation = validatedData.relation;
        isPrimary = validatedData.isPrimary;

        const email = validatedData.email || `student.${Date.now()}@${parentUser.schoolId}.eduit.com`;
        
        if (validatedData.email) {
            const existingUser = await db.user.findUnique({
                where: { email: validatedData.email },
                select: { id: true }
            });
            if (existingUser) {
                return NextResponse.json({ message: "Email already in use" }, { status: 400 });
            }
        }

        const password = generatePassword();
        const hashedPassword = await hash(password, 10);

        const newStudent = await db.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name: validatedData.name,
                    email,
                    password: hashedPassword,
                    role: UserRole.STUDENT,
                    schoolId: parentUser.schoolId,
                }
            });

            const student = await tx.student.create({
                data: {
                    userId: user.id,
                    gender: validatedData.gender,
                    dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : undefined,
                }
            });

            return { user, student };
        });

        studentIdToLink = newStudent.student.id;

        // Send welcome email for newly created student
        try {
            const school = await db.school.findUnique({
                where: { id: parentUser.schoolId! },
                select: { name: true, subdomain: true }
            });
            const schoolUrl = school?.subdomain
                ? `https://${school.subdomain}.eduit.app`
                : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

            await sendStudentCredentialsEmail({
                studentName: validatedData.name,
                studentEmail: email,
                password,
                schoolName: school?.name || "School",
                schoolUrl,
                schoolId: parentUser.schoolId!,
                parentName: parentUser.name,
                parentEmail: (await db.user.findUnique({ where: { id: parentUser.id }, select: { email: true } }))?.email || ""
            });
        } catch (error) {
            console.error("[API_PARENTS_STUDENTS] Failed to send student welcome email", error);
        }
    } else {
        return NextResponse.json({ message: "Invalid request: Must provide studentId or action: 'create'" }, { status: 400 });
    }

    // Double check the student record exists and belongs to the same school
    const studentRecord = await db.student.findUnique({
        where: { id: studentIdToLink },
        include: { user: { select: { schoolId: true, name: true, id: true } } }
    });

    if (!studentRecord) {
      console.log(`[API_PARENTS_STUDENTS] Post-checks failed: Student ${studentIdToLink} not found`);
      return NextResponse.json({ message: "Internal error: Student record vanished" }, { status: 404 });
    }

    if (studentRecord.user.schoolId !== parentUser.schoolId) {
      console.log(`[API_PARENTS_STUDENTS] School mismatch. Student school: ${studentRecord.user.schoolId}, Parent school: ${parentUser.schoolId}`);
      return NextResponse.json(
        { message: "Student and parent must belong to the same school" },
        { status: 400 }
      );
    }

    // Check if student is already linked to this parent
    const existingLink = await db.studentParent.findFirst({
      where: {
        studentId: studentRecord.id,
        parentId: parentUser.parent.id,
      },
    });

    if (existingLink) {
      return NextResponse.json({ message: "Student is already linked to this parent" }, { status: 400 });
    }

    // Create the parent-student relationship
    const result = await db.studentParent.create({
      data: {
        studentId: studentRecord.id,
        parentId: parentUser.parent.id,
        relation: relation,
        isPrimary: isPrimary,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      id: result.student.user.id,
      name: result.student.user.name,
      relation: result.relation,
      linkId: result.id,
      isPrimary: result.isPrimary,
    });
  } catch (error) {
    console.error("[API_PARENTS_STUDENTS] ERROR:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    
    if (!session || (
        session.role !== UserRole.SUPER_ADMIN &&
        session.role !== UserRole.SCHOOL_ADMIN &&
        session.role !== UserRole.TEACHER
    )) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const linkId = url.searchParams.get("linkId");

    if (!linkId) {
      return NextResponse.json({ message: "Link ID is required" }, { status: 400 });
    }

    // Delete the relationship
    await db.studentParent.delete({
      where: { id: linkId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[API_PARENTS_STUDENTS] DELETE ERROR:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const children = await db.studentParent.findMany({
      where: {
        parent: {
          userId: id
        }
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              }
            },
            classes: {
                take: 1,
                include: {
                    class: true
                }
            }
          }
        }
      }
    });

    return NextResponse.json(children.map(c => ({
        id: c.student.user.id,
        name: c.student.user.name,
        profileImage: c.student.user.profileImage,
        class: c.student.classes[0]?.class?.name || "Not assigned",
        relation: c.relation,
        isPrimary: c.isPrimary,
        linkId: c.id
    })));
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
