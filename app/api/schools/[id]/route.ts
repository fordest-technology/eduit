import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const schoolId = params.id;

    // Check if user has permission to view this school
    if (session.role !== "super_admin" && session.schoolId !== schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        shortName: true,
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
    console.error("Error fetching school:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const schoolId = params.id;

    // Check if user has permission to update this school
    if (
      session.role !== "super_admin" &&
      (session.role !== "school_admin" || session.schoolId !== schoolId)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, address, phone, email, logo } = body;

    // Update school
    const school = await prisma.school.update({
      where: { id: schoolId },
      data: {
        ...(name ? { name } : {}),
        ...(address ? { address } : {}),
        ...(phone ? { phone } : {}),
        ...(email ? { email } : {}),
        ...(logo ? { logo } : {}),
      },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        logo: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(school);
  } catch (error) {
    console.error("Error updating school:", error);
    return NextResponse.json(
      { error: "Failed to update school" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();

  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const schoolId = params.id;

    // Delete school (this will cascade delete all related records)
    await prisma.school.delete({
      where: { id: schoolId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting school:", error);
    return NextResponse.json(
      { error: "Failed to delete school" },
      { status: 500 }
    );
  }
}
