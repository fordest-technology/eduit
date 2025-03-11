import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session || (session.role !== "super_admin" && session.role !== "school_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { studentId, classId, sessionId, rollNumber } = body

    // Validate required fields
    if (!studentId || !classId || !sessionId) {
      return NextResponse.json({ error: "Student ID, Class ID, and Session ID are required" }, { status: 400 })
    }

    // Check if student exists and is a student
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        role: "STUDENT",
      },
      select: { id: true, schoolId: true },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Check if class exists
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      select: { id: true, schoolId: true },
    })

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Check if session exists
    const academicSession = await prisma.academicSession.findUnique({
      where: { id: sessionId },
      select: { id: true, schoolId: true },
    })

    if (!academicSession) {
      return NextResponse.json({ error: "Academic session not found" }, { status: 404 })
    }

    // Check if student, class, and session belong to the same school
    if (student.schoolId !== classData.schoolId || student.schoolId !== academicSession.schoolId) {
      return NextResponse.json({ error: "Student, class, and session must belong to the same school" }, { status: 400 })
    }

    // Check if user has permission to assign this student
    if (session.role === "school_admin" && student.schoolId !== session.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if student is already assigned to a class in this session
    const existingAssignment = await prisma.studentClass.findFirst({
      where: {
        studentId,
        sessionId,
      },
    })

    let result

    if (existingAssignment) {
      // Update existing assignment
      result = await prisma.studentClass.update({
        where: { id: existingAssignment.id },
        data: {
          classId,
          rollNumber,
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          class: {
            select: {
              id: true,
              name: true,
              section: true,
            },
          },
          session: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
    } else {
      // Create new assignment
      result = await prisma.studentClass.create({
        data: {
          studentId,
          classId,
          sessionId,
          rollNumber,
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          class: {
            select: {
              id: true,
              name: true,
              section: true,
            },
          },
          session: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
    }

    return NextResponse.json(result, { status: existingAssignment ? 200 : 201 })
  } catch (error) {
    console.error("Error assigning student to class:", error)
    return NextResponse.json({ error: "Failed to assign student to class" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const classId = searchParams.get("classId")
    const sessionId = searchParams.get("sessionId")

    const where: any = {}

    if (studentId) {
      where.studentId = studentId
    }

    if (classId) {
      where.classId = classId
    }

    if (sessionId) {
      where.sessionId = sessionId
    }

    // If school admin, restrict to their school
    if (session.role === "school_admin") {
      where.student = {
        schoolId: session.schoolId,
      }
    }

    // If student, restrict to their own assignments
    if (session.role === "student") {
      where.studentId = session.id
    }

    // If parent, restrict to their children's assignments
    if (session.role === "parent") {
      const children = await prisma.studentParent.findMany({
        where: { parentId: session.id },
        select: { studentId: true },
      })

      const childrenIds = children.map((child) => child.studentId)

      if (childrenIds.length === 0) {
        return NextResponse.json([])
      }

      where.studentId = { in: childrenIds }
    }

    const assignments = await prisma.studentClass.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            section: true,
            teacher: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        session: {
          select: {
            id: true,
            name: true,
            isCurrent: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error("Error fetching student class assignments:", error)
    return NextResponse.json({ error: "Failed to fetch student class assignments" }, { status: 500 })
  }
}

