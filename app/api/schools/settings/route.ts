import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth-server";
import { UserRole } from "@prisma/client";
import { uploadImage } from "@/lib/cloudinary";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const school = await prisma.school.findUnique({
      where: { id: session.schoolId },
      select: {
        name: true,
        shortName: true,
        address: true,
        phone: true,
        email: true,
        logo: true,
        primaryColor: true,
        secondaryColor: true,
      },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    return NextResponse.json(school);
  } catch (error) {
    console.error("Error fetching school settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch school settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession();

  if (
    !session ||
    (session.role !== UserRole.SUPER_ADMIN &&
      session.role !== UserRole.SCHOOL_ADMIN)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let formData;
    let logoUrl: string | null = null;

    try {
      formData = await request.formData();
    } catch (error) {
      console.error("Error parsing form data:", error);
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    // Handle logo file if present
    const logoFile = formData.get("logo");
    if (logoFile instanceof Blob) {
      try {
        // Convert File to base64
        const bytes = await logoFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Data = buffer.toString("base64");
        const base64File = `data:${logoFile.type};base64,${base64Data}`;

        // Upload to Cloudinary
        logoUrl = await uploadImage(base64File);
      } catch (error) {
        console.error("Error uploading logo:", error);
        return NextResponse.json(
          { error: "Failed to upload logo" },
          { status: 500 }
        );
      }
    }

    // Extract form fields
    const name = formData.get("name")?.toString() || "";
    const shortName = formData.get("shortName")?.toString() || "";
    const address = formData.get("address")?.toString() || "";
    const phone = formData.get("phone")?.toString() || "";
    const email = formData.get("email")?.toString() || "";
    const primaryColor = formData.get("primaryColor")?.toString() || "";
    const secondaryColor = formData.get("secondaryColor")?.toString() || "";

    // Validate required fields
    if (!name || !email || !shortName) {
      return NextResponse.json(
        { error: "Name, email and short name are required" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if email is already taken by another school
    const existingSchool = await prisma.school.findFirst({
      where: {
        email,
        id: { not: session.schoolId },
      },
    });

    if (existingSchool) {
      return NextResponse.json(
        { error: "Email is already taken" },
        { status: 400 }
      );
    }

    // Check if shortName is already taken by another school
    const existingSchoolByShortName = await prisma.school.findFirst({
      where: {
        shortName,
        id: { not: session.schoolId },
      },
    });

    if (existingSchoolByShortName) {
      return NextResponse.json(
        { error: "Short name is already taken" },
        { status: 400 }
      );
    }

    // Update school settings
    const updatedSchool = await prisma.school.update({
      where: { id: session.schoolId },
      data: {
        name,
        shortName,
        address: address || null,
        phone: phone || null,
        email,
        ...(logoUrl && { logo: logoUrl }),
        primaryColor: primaryColor || null,
        secondaryColor: secondaryColor || null,
      },
      select: {
        name: true,
        shortName: true,
        address: true,
        phone: true,
        email: true,
        logo: true,
        primaryColor: true,
        secondaryColor: true,
      },
    });

    return NextResponse.json(updatedSchool);
  } catch (error) {
    console.error("Error updating school settings:", error);
    return NextResponse.json(
      { error: "Failed to update school settings" },
      { status: 500 }
    );
  }
}
