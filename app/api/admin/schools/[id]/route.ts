import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();

  if (!session || session.role !== "super_admin") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const school = await prisma.school.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        logo: true,
        shortName: true,
        createdAt: true,
        _count: {
          select: {
            users: {
              where: {
                role: "TEACHER",
              },
            },
          },
        },
        users: {
          where: {
            OR: [{ role: "STUDENT" }, { role: "PARENT" }, { role: "TEACHER" }],
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profileImage: true,
          },
        },
        subjects: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!school) {
      return new NextResponse("School not found", { status: 404 });
    }

    // Transform the data to include user counts by role
    const transformedSchool = {
      ...school,
      teacherCount: school.users.filter((user) => user.role === "TEACHER")
        .length,
      studentCount: school.users.filter((user) => user.role === "STUDENT")
        .length,
      parentCount: school.users.filter((user) => user.role === "PARENT").length,
      subjectCount: school.subjects.length,
      recentTeachers: school.users
        .filter((user) => user.role === "TEACHER")
        .slice(0, 5),
      recentStudents: school.users
        .filter((user) => user.role === "STUDENT")
        .slice(0, 5),
    };

    return NextResponse.json(transformedSchool);
  } catch (error) {
    console.error("Error fetching school details:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
