import { type NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs"; // Changed from bcrypt to bcryptjs
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (
    !session ||
    (session.role !== "super_admin" && session.role !== "school_admin")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const schoolId =
      session.role === "super_admin"
        ? searchParams.get("schoolId") || undefined
        : session.schoolId;

    // Create the where object with proper typing for role
    const where: any = {};

    // Only add role to filter if it exists, and make sure it's properly typed as an enum
    if (role) {
      where.role = role.toUpperCase() as any;
    }

    // Add schoolId to filter if it exists
    if (schoolId) {
      where.schoolId = schoolId;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        schoolId: true,
        gender: true,
        dateOfBirth: true,
        religion: true,
        address: true,
        phone: true,
        country: true,
        city: true,
        state: true,
        profileImage: true,
        createdAt: true,
        school: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (
    !session ||
    (session.role !== "super_admin" && session.role !== "school_admin")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if the request is multipart/form-data
    const contentType = request.headers.get("content-type") || "";

    let body;
    let profileImageUrl = null;

    if (contentType.includes("multipart/form-data")) {
      // Handle multipart form data with file upload
      const formData = await request.formData();

      // Extract text fields
      body = Object.fromEntries(
        Array.from(formData.entries()).filter(
          ([key, value]) => key !== "profileImage" && typeof value === "string"
        )
      );

      // Handle profile image upload
      const profileImage = formData.get("profileImage") as File;
      if (profileImage && profileImage.size > 0) {
        // Convert file to base64 for Cloudinary upload
        const buffer = await profileImage.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const dataURI = `data:${profileImage.type};base64,${base64}`;

        // Upload to Cloudinary
        profileImageUrl = await uploadImage(dataURI);
      }
    } else {
      // Handle regular JSON request
      body = await request.json();
    }

    const {
      name,
      email,
      password,
      role,
      schoolId,
      gender,
      dateOfBirth,
      religion,
      address,
      phone,
      country,
      city,
      state,
      classId,
      parentId,
    } = body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Determine school ID based on user role
    let finalSchoolId = schoolId;
    if (session.role === "school_admin") {
      finalSchoolId = session.schoolId;
    } else if (
      !finalSchoolId &&
      session.role === "super_admin" &&
      role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "School ID is required for this user role" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role.toUpperCase(),
        ...(finalSchoolId ? { schoolId: finalSchoolId } : {}),
        ...(gender ? { gender } : {}),
        ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
        ...(religion ? { religion } : {}),
        ...(address ? { address } : {}),
        ...(phone ? { phone } : {}),
        ...(country ? { country } : {}),
        ...(city ? { city } : {}),
        ...(state ? { state } : {}),
        ...(profileImageUrl ? { profileImage: profileImageUrl } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        schoolId: true,
        gender: true,
        dateOfBirth: true,
        religion: true,
        address: true,
        phone: true,
        country: true,
        city: true,
        state: true,
        profileImage: true,
        createdAt: true,
      },
    });

    // If user is a student and classId is provided, assign to class
    if (role.toUpperCase() === "STUDENT" && classId) {
      // Get current academic session
      const currentSession = await prisma.academicSession.findFirst({
        where: {
          schoolId: finalSchoolId,
          isCurrent: true,
        },
      });

      if (currentSession) {
        // Assign student to class
        await prisma.studentClass.create({
          data: {
            studentId: user.id,
            classId,
            sessionId: currentSession.id,
          },
        });
      }
    }

    // If parentId is provided, link student to parent
    if (role.toUpperCase() === "STUDENT" && parentId) {
      await prisma.studentParent.create({
        data: {
          studentId: user.id,
          parentId,
        },
      });
    }

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
