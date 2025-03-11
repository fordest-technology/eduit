import { type NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import { uploadImage } from "@/lib/cloudinary";

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
        // Convert file to base64 for Cloudinary upload
        const buffer = await logoFile.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const dataURI = `data:${logoFile.type};base64,${base64}`;

        // Upload to Cloudinary
        logoUrl = await uploadImage(dataURI);
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
    try {
      const existingSchoolByEmail = await prisma.school.findUnique({
        where: { email },
      });

      if (existingSchoolByEmail) {
        return NextResponse.json(
          { error: "School email already in use" },
          { status: 400 }
        );
      }
    } catch (emailCheckError) {
      console.error("Error checking school email:", emailCheckError);
      return NextResponse.json(
        {
          error: "Failed to check if school email exists",
          details: emailCheckError.message,
        },
        { status: 500 }
      );
    }

    // Check if school shortName already exists
    try {
      const existingSchoolByShortName = await prisma.school.findUnique({
        where: { shortName },
      });

      if (existingSchoolByShortName) {
        return NextResponse.json(
          { error: "School short name already in use" },
          { status: 400 }
        );
      }
    } catch (shortNameCheckError) {
      console.error("Error checking school shortName:", shortNameCheckError);
      // Continue with registration even if check fails
    }

    // Check if admin email already exists
    try {
      const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail },
      });

      if (existingAdmin) {
        return NextResponse.json(
          { error: "Admin email already in use" },
          { status: 400 }
        );
      }
    } catch (adminCheckError) {
      console.error("Error checking admin email:", adminCheckError);
      return NextResponse.json(
        {
          error: "Failed to check if admin email exists",
          details: adminCheckError.message,
        },
        { status: 500 }
      );
    }

    // Generate a unique subdomain for the school
    const subdomain = shortName.toLowerCase();

    // Hash admin password
    const hashedPassword = await hash(adminPassword, 10);

    // Create school and admin in a transaction
    try {
      // First, let's check what fields are available in the School model
      console.log("Checking School model fields...");

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
            // primaryColor and secondaryColor are removed since they don't exist in your schema
          },
        });

        // Create school admin
        const admin = await tx.user.create({
          data: {
            name: adminName,
            email: adminEmail,
            password: hashedPassword,
            role: "SCHOOL_ADMIN",
            schoolId: school.id,
          },
        });

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
          details: transactionError.message,
          code: transactionError.code,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error registering school:", error);
    return NextResponse.json(
      {
        error: "Failed to register school",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
