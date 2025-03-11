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
    const subjectId = searchParams.get("subjectId")
    const teacherId = searchParams.get("teacherId")

    const where: any = {}

    if (subjectId) {
      where.subjectId = subjectId
    }

    if (teacherId) {
      where.teacherId = teacherId
    }

    // If not super admin, restrict to school
    if (session.role !== "super_admin" && session.schoolId) {
      where.teacher = {
        schoolId: session.schoolId,
      }
    }

    const subjectTeachers = await prisma.subjectTeacher.findMany({
      where,
      include: {
        subject: true,
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            schoolId: true,
          },
        },
      },
    })

    return NextResponse.json(subjectTeachers)
  } catch (error) {
    console.error("Error fetching subject teachers:", error)
    return NextResponse.json({ error: "Failed to fetch subject teachers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session || (session.role !== "super_admin" && session.role !== "school_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { subjectId, teacherId } = body

    // Validate required fields
    if (!subjectId || !teacherId) {
      return NextResponse.json({ error: "Subject ID and Teacher ID are required" }, { status: 400 })
    }

    // Check if subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { schoolId: true },
    })

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    // Check if teacher exists and is a teacher
    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        role: "TEACHER",
      },
      select: { schoolId: true },
    })

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    // Check if teacher and subject belong to the same school
    if (teacher.schoolId !== subject.schoolId) {
      return NextResponse.json({ error: "Teacher and subject must belong to the same school" }, { status: 400 })
    }

    // Check if user has permission to assign teachers to this subject
    if (session.role !== "super_admin" && subject.schoolId !== session.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.subjectTeacher.findFirst({
      where: {
        subjectId,
        teacherId,
      },
    })

    if (existingAssignment) {
      return NextResponse.json({ error: "Teacher is already assigned to this subject" }, { status: 400 })
    }

    // Create subject teacher assignment
    const subjectTeacher = await prisma.subjectTeacher.create({
      data: {
        subjectId,
        teacherId,
      },
      include: {
        subject: true,
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(subjectTeacher, { status: 201 })
  } catch (error) {
    console.error("Error assigning teacher to subject:", error)
    return NextResponse.json({ error: "Failed to assign teacher to subject" }, { status: 500 })
  }
}

