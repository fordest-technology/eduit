import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const classId = params.id

    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        subjects: {
          include: {
            subject: true,
          },
        },
        students: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            session: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Check if user has permission to view this class
    if (session.role !== "super_admin" && classData.schoolId !== session.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(classData)
  } catch (error) {
    console.error("Error fetching class:", error)
    return NextResponse.json({ error: "Failed to fetch class" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()

  if (!session || (session.role !== "super_admin" && session.role !== "school_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const classId = params.id

    // Check if class exists and user has permission to update it
    const existingClass = await prisma.class.findUnique({
      where: { id: classId },
      select: { schoolId: true },
    })

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    if (session.role !== "super_admin" && existingClass.schoolId !== session.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, section, teacherId } = body

    // If teacherId is provided, verify the teacher exists and belongs to the school
    if (teacherId) {
      const teacher = await prisma.user.findFirst({
        where: {
          id: teacherId,
          role: "TEACHER",
          schoolId: existingClass.schoolId,
        },
      })

      if (!teacher) {
        return NextResponse.json({ error: "Teacher not found or not assigned to this school" }, { status: 400 })
      }
    }

    // Update class
    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: {
        ...(name ? { name } : {}),
        ...(section !== undefined ? { section } : {}),
        ...(teacherId !== undefined ? { teacherId } : {}),
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

    return NextResponse.json(updatedClass)
  } catch (error) {
    console.error("Error updating class:", error)
    return NextResponse.json({ error: "Failed to update class" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()

  if (!session || (session.role !== "super_admin" && session.role !== "school_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const classId = params.id

    // Check if class exists and user has permission to delete it
    const existingClass = await prisma.class.findUnique({
      where: { id: classId },
      select: { schoolId: true },
    })

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    if (session.role !== "super_admin" && existingClass.schoolId !== session.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete class
    await prisma.class.delete({
      where: { id: classId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting class:", error)
    return NextResponse.json({ error: "Failed to delete class" }, { status: 500 })
  }
}

