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
    const { parentId, studentIds, relation } = body

    // Validate required fields
    if (!parentId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: "Parent ID and at least one student ID are required" }, { status: 400 })
    }

    // Check if parent exists and is a parent
    const parent = await prisma.user.findFirst({
      where: {
        id: parentId,
        role: "PARENT",
      },
      select: { id: true, schoolId: true },
    })

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 })
    }

    // Check if user has permission to link this parent
    if (session.role === "school_admin" && parent.schoolId !== session.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if all students exist and belong to the same school
    const students = await prisma.user.findMany({
      where: {
        id: { in: studentIds },
        role: "STUDENT",
      },
      select: { id: true, schoolId: true },
    })

    if (students.length !== studentIds.length) {
      return NextResponse.json({ error: "One or more students not found" }, { status: 404 })
    }

    // If school admin, check if all students belong to their school
    if (session.role === "school_admin") {
      const invalidStudents = students.filter((student) => student.schoolId !== session.schoolId)

      if (invalidStudents.length > 0) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    // Create parent-student relationships
    const results = await Promise.all(
      studentIds.map(async (studentId) => {
        // Check if relationship already exists
        const existingRelation = await prisma.studentParent.findUnique({
          where: {
            studentId_parentId: {
              studentId,
              parentId,
            },
          },
        })

        if (existingRelation) {
          // Update relation if provided
          if (relation) {
            return prisma.studentParent.update({
              where: {
                id: existingRelation.id,
              },
              data: {
                relation,
              },
            })
          }
          return existingRelation
        }

        // Create new relationship
        return prisma.studentParent.create({
          data: {
            studentId,
            parentId,
            relation,
          },
        })
      }),
    )

    return NextResponse.json(
      {
        success: true,
        count: results.length,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error linking parent to students:", error)
    return NextResponse.json({ error: "Failed to link parent to students" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get("parentId")
    const studentId = searchParams.get("studentId")

    const where: any = {}

    if (parentId) {
      where.parentId = parentId
    }

    if (studentId) {
      where.studentId = studentId
    }

    // If school admin, restrict to their school
    if (session.role === "school_admin") {
      where.student = {
        schoolId: session.schoolId,
      }
    }

    // If parent, restrict to their own relationships
    if (session.role === "parent") {
      where.parentId = session.id
    }

    const relationships = await prisma.studentParent.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            schoolId: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(relationships)
  } catch (error) {
    console.error("Error fetching parent-student relationships:", error)
    return NextResponse.json({ error: "Failed to fetch parent-student relationships" }, { status: 500 })
  }
}

