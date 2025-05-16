import { getSession } from "@/lib/auth";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { mkdir } from "fs/promises";
import { generatePassword, hashPassword } from "@/lib/auth/password";
import { sendEmail, sendWelcomeEmail } from "@/lib/email";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["SUPER_ADMIN", "SCHOOL_ADMIN"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

// Type guard for allowed roles
function isAllowedRole(role: string | undefined): role is AllowedRole {
  return ALLOWED_ROLES.includes(role as AllowedRole);
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user has an allowed role
    if (!isAllowedRole(session.role)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Fetch parents based on role
    const parents = await prisma.user.findMany({
      where: {
        role: "PARENT",
        schoolId:
          session.role === "SCHOOL_ADMIN" ? session.schoolId : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        parent: {
          select: {
            phone: true,
            _count: {
              select: {
                children: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Get school colors if school admin
    let schoolColors = {
      primaryColor: "#3b82f6",
      secondaryColor: "#1f2937",
    };

    if (session.schoolId) {
      const school = await prisma.school.findUnique({
        where: { id: session.schoolId },
        select: {
          primaryColor: true,
          secondaryColor: true,
          name: true,
        },
      });

      if (school?.primaryColor && school?.secondaryColor) {
        schoolColors = {
          primaryColor: school.primaryColor,
          secondaryColor: school.secondaryColor,
        };
      }
    }

    return NextResponse.json({
      parents: parents.map((parent) => ({
        id: parent.id,
        name: parent.name,
        email: parent.email,
        profileImage: parent.profileImage,
        phone: parent.parent?.phone,
        childrenCount: parent.parent?._count?.children || 0,
      })),
      schoolColors,
    });
  } catch (error) {
    console.error("[PARENTS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user has an allowed role
    if (!isAllowedRole(session.role)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string | null;
    const providedPassword = formData.get("password") as string | null;
    const profileImage = formData.get("profileImage") as File | null;

    if (!name || !email) {
      return new NextResponse(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return new NextResponse(
        JSON.stringify({
          error: "Email already in use",
          code: "EMAIL_EXISTS",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generate or use provided password
    const password = providedPassword || generatePassword();

    // Get school information for the welcome email
    const school = session.schoolId
      ? await prisma.school.findUnique({
          where: { id: session.schoolId },
          select: { name: true },
        })
      : null;

    // Create the parent user within a transaction
    const parent = await prisma.$transaction(async (tx) => {
      // Create the user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: await hashPassword(password),
          role: "PARENT",
          schoolId: session.role === "SCHOOL_ADMIN" ? session.schoolId : null,
        },
      });

      // Create the parent profile
      await tx.parent.create({
        data: {
          userId: user.id,
          phone: phone || undefined,
        },
      });

      return user;
    });

    // Handle profile image upload if provided
    if (profileImage) {
      // Implement your file upload logic here
      // Update the user with the profile image URL
    }

    // Send welcome email with credentials
    let emailSent = false;
    try {
      await sendWelcomeEmail({
        email,
        name,
        password,
        role: "parent",
        schoolName: school?.name || "School",
        schoolUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      });
      emailSent = true;
    } catch (error) {
      console.error("[WELCOME_EMAIL]", error);
    }

    return NextResponse.json({
      message: "Parent created successfully",
      emailSent,
      parent: {
        id: parent.id,
        name: parent.name,
        email: parent.email,
      },
    });
  } catch (error) {
    console.error("[PARENTS_POST]", error);

    // Handle Prisma unique constraint violation
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return new NextResponse(
        JSON.stringify({
          error: "Email already in use",
          code: "EMAIL_EXISTS",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
