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

    const subjects = await prisma.subject.findMany({
      where: {
        schoolId: schoolId as string,
      },
      include: {
        _count: {
          select: {
            teachers: true,
            classes: true,
          },
        },
      },
    })

    return NextResponse.json(subjects)
  } catch (error) {
    console.error("Error fetching subjects:", error)
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session || (session.role !== "super_admin" && session.role !== "school_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, code, description, schoolId } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Subject name is required" }, { status: 400 })
    }

    // Determine school ID
    const finalSchoolId = session.role === "super_admin" && schoolId ? schoolId : session.schoolId

    if (!finalSchoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 })
    }

    // Create subject
    const subject = await prisma.subject.create({
      data: {
        name,
        code,
        description,
        schoolId: finalSchoolId,
      },
    })

    return NextResponse.json(subject, { status: 201 })
  } catch (error) {
    console.error("Error creating subject:", error)
    return NextResponse.json({ error: "Failed to create subject" }, { status: 500 })
  }
}

