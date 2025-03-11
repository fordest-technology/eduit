import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const schoolId = session.role === "super_admin" ? searchParams.get("schoolId") || undefined : session.schoolId

    const classes = await prisma.class.findMany({
      where: {
        schoolId: schoolId as string,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            students: true,
            subjects: true,
          },
        },
      },
    })

    return NextResponse.json(classes)
  } catch (error) {
    console.error("Error fetching classes:", error)
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session || (session.role !== "super_admin" && session.role !== "school_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, section, teacherId, schoolId } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Class name is required" }, { status: 400 })
    }

    // Determine school ID
    const finalSchoolId = session.role === "super_admin" && schoolId ? schoolId : session.schoolId

    if (!finalSchoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 })
    }

    // If teacherId is provided, verify the teacher exists and belongs to the school
    if (teacherId) {
      const teacher = await prisma.user.findFirst({
        where: {
          id: teacherId,
          role: "TEACHER",
          schoolId: finalSchoolId,
        },
      })

      if (!teacher) {
        return NextResponse.json({ error: "Teacher not found or not assigned to this school" }, { status: 400 })
      }
    }

    // Create class
    const classData = await prisma.class.create({
      data: {
        name,
        section,
        schoolId: finalSchoolId,
        ...(teacherId ? { teacherId } : {}),
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(classData, { status: 201 })
  } catch (error) {
    console.error("Error creating class:", error)
    return NextResponse.json({ error: "Failed to create class" }, { status: 500 })
  }
}

