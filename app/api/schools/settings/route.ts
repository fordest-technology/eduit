import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";

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
        address: true,
        phone: true,
        email: true,
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
    (session.role !== "super_admin" && session.role !== "school_admin")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, address, phone, email, primaryColor, secondaryColor } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
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

    // Update school settings
    const school = await prisma.school.update({
      where: { id: session.schoolId },
      data: {
        name,
        address,
        phone,
        email,
        primaryColor,
        secondaryColor,
      },
      select: {
        name: true,
        address: true,
        phone: true,
        email: true,
        primaryColor: true,
        secondaryColor: true,
      },
    });

    return NextResponse.json(school);
  } catch (error) {
    console.error("Error updating school settings:", error);
    return NextResponse.json(
      { error: "Failed to update school settings" },
      { status: 500 }
    );
  }
}
