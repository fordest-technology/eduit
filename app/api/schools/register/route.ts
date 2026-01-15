import { type NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import { uploadImage } from "@/lib/cloudinary";
import { UserRole, AdminType } from "@prisma/client";
import { checkCloudinaryConfig } from "@/lib/env-check";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { join } from "path";
import { randomUUID } from "crypto";
import { applySchoolTemplate } from "@/lib/school-templates";

// Helper function to handle file uploads locally if Cloudinary is not available
async function handleFileUpload(file: File): Promise<string | null> {
  try {
    // Check if Cloudinary is configured
    const isCloudinaryConfigured = checkCloudinaryConfig();

    if (isCloudinaryConfigured) {
      // Use Cloudinary for file upload
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      const dataURI = `data:${file.type};base64,${base64}`;

      return await uploadImage(dataURI);
    } else {
      // Fallback to local file storage
      const uploadDir = join(process.cwd(), "public", "uploads", "logos");
      await mkdir(uploadDir, { recursive: true });

      const filename = `${randomUUID()}-${file.name.replace(/\s/g, "_")}`;
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
        schoolType: formData.get("schoolType") as string,
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

    const {
      schoolName,
      shortName,
      address,
      phone,
      email,
      adminName,
      adminEmail,
      adminPassword,
    } = body;

    // Validate required fields
    if (
      !schoolName ||
      !shortName ||
      !email ||
      !adminName ||
      !adminEmail ||
      !adminPassword
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

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
      // Create school with only the fields that exist in your schema
      const result = await prisma.$transaction(async (tx) => {
        // Create school with only the fields that exist in your schema
        // IMPORTANT: We're only including fields that are in your Prisma schema
        const school = await tx.school.create({
          data: {
            name: schoolName,
            shortName,
            address: address || null,
            phone: phone || null,
            email,
            logo: logoUrl,
            subdomain,
            // Add the color fields from the form
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
            // Create the admin profile with a nested create
            admin: {
              create: {
                adminType: AdminType.SCHOOL_ADMIN,
                permissions: JSON.stringify({
                  canManageUsers: true,
                  canManageClasses: true,
                  canManageDepartments: true,
                }),
              },
            },
          },
        });

        // Apply School Template (Levels, Classes, Session)
        // Default to "combined" if not specified
        const schoolType = body.schoolType || "combined";
        await applySchoolTemplate(tx, school.id, schoolType);

        return { school, admin };
      });

      // Send welcome email to school admin
      try {
        await sendWelcomeEmail({
          name: result.admin.name,
          email: result.admin.email,
          role: "School Admin",
          schoolName: result.school.name,
          schoolUrl: `https://${result.school.subdomain}.eduit.com`,
          password: adminPassword, // Only for demo - in production, use reset password links
        });
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
        // Continue with the response even if email fails
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
          error: "Failed to create school and admin",
          details:
            transactionError instanceof Error
              ? transactionError.message
              : "Unknown error",
          code: (transactionError as any)?.code,
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
