import { type NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendSchoolWelcomeEmail } from "@/lib/email";
import { uploadImage } from "@/lib/cloudinary";
import { UserRole, AdminType } from "@prisma/client";
import { checkCloudinaryConfig } from "@/lib/env-check";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { applySchoolTemplate } from "@/lib/school-templates";
import { z } from "zod";
import { sanitizeInput } from "@/lib/security";

const registrationSchema = z.object({
  schoolName: z.string().min(3).max(100),
  shortName: z.string().min(2).max(20).regex(/^[a-zA-Z0-9-]+$/, "Short name can only contain alphanumeric characters and hyphens"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email(),
  adminName: z.string().min(2).max(100),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{3}){1,2}$/).optional(),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{3}){1,2}$/).optional(),
});

// Helper function to handle file uploads locally if Cloudinary is not available
async function handleFileUpload(file: File): Promise<string | null> {
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
  const MAX_SIZE = 2 * 1024 * 1024; // 2MB

  if (!ALLOWED_TYPES.includes(file.type)) {
    console.error(`Rejected file type: ${file.type}`);
    return null;
  }

  if (file.size > MAX_SIZE) {
    console.error(`File size too large: ${file.size}`);
    return null;
  }

  try {
    const isCloudinaryConfigured = checkCloudinaryConfig();

    if (isCloudinaryConfigured) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      const dataURI = `data:${file.type};base64,${base64}`;

      return await uploadImage(dataURI);
    } else {
      const uploadDir = join(process.cwd(), "public", "uploads", "logos");
      await mkdir(uploadDir, { recursive: true });

      // Sanitize filename: only alphanumeric + extension
      const ext = file.name.split('.').pop() || 'png';
      const filename = `${randomUUID()}.${ext.replace(/[^a-zA-Z0-9]/g, '')}`;
      const filePath = join(uploadDir, filename);

      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);

      return `/uploads/logos/${filename}`;
    }
  } catch (error) {
    console.error("Error handling file upload:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if the request is multipart/form-data
    const contentType = request.headers.get("content-type") || "";

    let body;
    let logoUrl = null;

    if (contentType.includes("multipart/form-data")) {
      // Handle multipart form data with file upload
      const formData = await request.formData();

      // Extract text fields
      body = {
        schoolName: formData.get("schoolName") as string,
        shortName: formData.get("shortName") as string,
        address: formData.get("address") as string,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        primaryColor: formData.get("primaryColor") as string,
        secondaryColor: formData.get("secondaryColor") as string,
        adminName: formData.get("adminName") as string,
        adminEmail: formData.get("adminEmail") as string,
        adminPassword: formData.get("adminPassword") as string,
      };

      // Handle logo upload
      const logoFile = formData.get("logo") as File;
      if (logoFile && logoFile.size > 0) {
        logoUrl = await handleFileUpload(logoFile);
      }
    } else {
      // Handle regular JSON request
      body = await request.json();
    }
    
    // Sanitize everything before validation
    const sanitizedBody = sanitizeInput(body);

    // Validate input with Zod
    const result = registrationSchema.safeParse(sanitizedBody);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const {
      schoolName,
      shortName,
      address,
      phone,
      email,
      adminName,
      adminEmail,
      adminPassword,
      primaryColor,
      secondaryColor,
    } = result.data;

    // Check if school email already exists
    const existingSchoolByEmail = await prisma.school
      .findUnique({
        where: { email },
      })
      .catch((error) => {
        console.error("Error checking school email:", error);
        return null; // Return null instead of throwing to continue execution
      });

    if (existingSchoolByEmail) {
      return NextResponse.json(
        { error: "School email already in use" },
        { status: 400 }
      );
    }

    // Check if school shortName already exists
    const existingSchoolByShortName = await prisma.school
      .findUnique({
        where: { shortName },
      })
      .catch((error) => {
        console.error("Error checking school shortName:", error);
        return null; // Return null instead of throwing to continue execution
      });

    if (existingSchoolByShortName) {
      return NextResponse.json(
        { error: "School short name already in use" },
        { status: 400 }
      );
    }

    // Check if admin email already exists
    const existingAdmin = await prisma.user
      .findUnique({
        where: { email: adminEmail },
      })
      .catch((error) => {
        console.error("Error checking admin email:", error);
        return null; // Return null instead of throwing to continue execution
      });

    if (existingAdmin) {
      return NextResponse.json(
        { error: "Admin email already in use" },
        { status: 400 }
      );
    }

    // Generate a unique subdomain for the school
    const subdomain = shortName.toLowerCase();

    // Hash admin password
    const hashedPassword = await hash(adminPassword, 10);

    // Create school and admin in a transaction
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create school
        const school = await tx.school.create({
          data: {
            name: schoolName,
            shortName,
            address: address || null,
            phone: phone || null,
            email,
            logo: logoUrl || null,
            subdomain: subdomain,
            primaryColor: body.primaryColor || "#22c55e",
            secondaryColor: body.secondaryColor || "#f59e0b",
          },
        });

        // Create school admin
        const admin = await tx.user.create({
          data: {
            name: adminName,
            email: adminEmail,
            password: hashedPassword,
            role: UserRole.SCHOOL_ADMIN,
            schoolId: school.id,
            admin: {
              create: {
                adminType: AdminType.SCHOOL_ADMIN,
                permissions: "[]", // Empty array means full access in our sidebar logic (Super Admin of the school)
              },
            },
          },
        });

        // Apply school template
        await applySchoolTemplate(tx, school.id, "combined");

        return { school, admin };
      }, {
        timeout: 120000 // 120 seconds for template application
      });

      // Send welcome email to school admin (and copy school email)
      try {
        const baseDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "eduit.com";
        const schoolUrl = `https://${result.school.subdomain}.${baseDomain}`;

        console.log(`Attempting to send welcome email to Admin: ${result.admin.email} and School: ${result.school.email}`);

        await sendSchoolWelcomeEmail({
          adminName: result.admin.name || "Administrator",
          adminEmail: result.admin.email,
          schoolName: result.school.name,
          schoolUrl: schoolUrl,
          password: adminPassword,
          primaryColor: result.school.primaryColor || "#f97316",
          secondaryColor: result.school.secondaryColor || "#0f172a",
          logoUrl: result.school.logo || undefined,
        });

        // If school email is different from admin email, we could send a second one or just rely on the first
        if (result.school.email !== result.admin.email) {
          console.log(`Note: School email (${result.school.email}) is different from Admin email (${result.admin.email}).`);
        }
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
      }

      return NextResponse.json(
        {
          success: true,
          school: {
            id: result.school.id,
            name: result.school.name,
            email: result.school.email,
            subdomain: result.school.subdomain,
          },
          admin: {
            id: result.admin.id,
            name: result.admin.name,
            email: result.admin.email,
          },
          schoolUrl: `https://${result.school.subdomain}.eduit.com`,
        },
        { status: 201 }
      );
    } catch (transactionError) {
      console.error("Transaction error:", transactionError);
      return NextResponse.json(
        {
          error: "Failed to register institutional portal. Please try again later.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error registering school:", error);
    return NextResponse.json(
      {
        error: "Failed to register school",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
