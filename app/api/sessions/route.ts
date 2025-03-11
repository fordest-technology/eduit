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
    const isCurrent = searchParams.get("isCurrent") === "true" ? true : undefined

    const academicSessions = await prisma.academicSession.findMany({
      where: {
        schoolId: schoolId as string,
        ...(isCurrent !== undefined ? { isCurrent } : {}),
      },
      orderBy: {
        startDate: "desc",
      },
    })

    return NextResponse.json(academicSessions)
  } catch (error) {
    console.error("Error fetching academic sessions:", error)
    return NextResponse.json({ error: "Failed to fetch academic sessions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session || (session.role !== "super_admin" && session.role !== "school_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, startDate, endDate, isCurrent, schoolId } = body

    // Validate required fields
    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: "Name, start date, and end date are required" }, { status: 400 })
    }

    // Determine school ID
    const finalSchoolId = session.role === "super_admin" && schoolId ? schoolId : session.schoolId

    if (!finalSchoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 })
    }

    // If setting as current, unset any other current sessions
    if (isCurrent) {
      await prisma.academicSession.updateMany({
        where: {
          schoolId: finalSchoolId,
          isCurrent: true,
        },
        data: {
          isCurrent: false,
        },
      })
    }

    // Create academic session
    const academicSession = await prisma.academicSession.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isCurrent: isCurrent || false,
        schoolId: finalSchoolId,
      },
    })

    return NextResponse.json(academicSession, { status: 201 })
  } catch (error) {
    console.error("Error creating academic session:", error)
    return NextResponse.json({ error: "Failed to create academic session" }, { status: 500 })
  }
}

