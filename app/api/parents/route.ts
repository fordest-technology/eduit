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
import * as z from "zod";

const ALLOWED_ROLES = ["SUPER_ADMIN", "SCHOOL_ADMIN"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

// Type guard for allowed roles
function isAllowedRole(role: string | undefined): role is AllowedRole {
  return ALLOWED_ROLES.includes(role as AllowedRole);
}

// Zod schema for parent creation
const parentFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  alternatePhone: z.string().optional(),
  occupation: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  password: z
    .string()
    .min(6, "Password is required and must be at least 6 characters"),
});

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

    // Fetch parents based on role - optimized query with only necessary fields
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
            alternatePhone: true,
            occupation: true,
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

    // Get school colors if school admin - use a single query for efficiency
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

    // Transform data for response
    const formattedParents = parents.map((parent) => ({
      id: parent.id,
      name: parent.name,
      email: parent.email,
      profileImage: parent.profileImage,
      phone: parent.parent?.phone,
      alternatePhone: parent.parent?.alternatePhone,
      occupation: parent.parent?.occupation,
      childrenCount: parent.parent?._count?.children || 0,
    }));

    // Add cache headers for better performance
    const response = NextResponse.json({
      parents: formattedParents,
      schoolColors,
    });

    // Cache for 60 seconds - adjust based on how frequently data changes
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );

    return response;
  } catch (error) {
    // Remove console logging in production
    if (process.env.NODE_ENV !== "production") {
      console.error("[PARENTS_GET]", error);
    }
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
    const profileImage = formData.get("profileImage") as File | null;

    // Extract and validate data using Zod
    const validatedData = parentFormSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      alternatePhone: formData.get("alternatePhone"),
      occupation: formData.get("occupation"),
      address: formData.get("address"),
      city: formData.get("city"),
      state: formData.get("state"),
      country: formData.get("country"),
      password: formData.get("password"),
    });

    const {
      name,
      email,
      phone,
      alternatePhone,
      occupation,
      address,
      city,
      state,
      country,
      password: providedPassword,
    } = validatedData;

    // Check if email already exists - optimize with select
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

    // Get school information for the welcome email - optimize with select
    const school = session.schoolId
      ? await prisma.school.findUnique({
          where: { id: session.schoolId },
          select: { name: true, subdomain: true },
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

      // Create the parent profile with additional fields from form data
      await tx.parent.create({
        data: {
          userId: user.id,
          phone: phone || undefined,
          alternatePhone: alternatePhone || undefined,
          occupation: occupation || undefined,
          address: address || undefined,
          city: city || undefined,
          state: state || undefined,
          country: country || undefined,
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
      const schoolUrl = school?.subdomain
        ? `https://${school.subdomain}.eduit.app`
        : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      await sendWelcomeEmail({
        email,
        name,
        password,
        role: "parent",
        schoolName: school?.name || "School",
        schoolUrl,
      });
      emailSent = true;
    } catch (error) {
      // Only log in development
      if (process.env.NODE_ENV !== "production") {
        console.error("[WELCOME_EMAIL]", error);
      }
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
    // Only log in development
    if (process.env.NODE_ENV !== "production") {
      console.error("[PARENTS_POST]", error);
    }

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ errors: error.errors }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

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
