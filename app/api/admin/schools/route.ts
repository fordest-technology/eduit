import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole, type User } from "@prisma/client";

export async function GET() {
  const session = await getSession();

  if (!session || session.role !== UserRole.SUPER_ADMIN) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        email: true,
        phone: true,
        createdAt: true,
        shortName: true,
        _count: {
          select: {
            users: {
              where: {
                role: UserRole.TEACHER,
              },
            },
          },
        },
        users: {
          where: {
            OR: [{ role: UserRole.STUDENT }, { role: UserRole.PARENT }],
          },
          select: {
            id: true,
            role: true,
          },
        },
      },
    });

    // Transform the data to include user counts by role
    const transformedSchools = schools.map((school) => ({
      id: school.id,
      name: school.name,
      location: school.address || "No address provided", // Use address field instead of location
      email: school.email,
      phone: school.phone,
      shortName: school.shortName,
      createdAt: school.createdAt,
      teacherCount: school._count.users,
      studentCount: school.users.filter(
        (user) => user.role === UserRole.STUDENT
      ).length,
      parentCount: school.users.filter((user) => user.role === UserRole.PARENT)
        .length,
    }));

    return NextResponse.json(transformedSchools);
  } catch (error) {
    console.error("Error fetching schools:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
