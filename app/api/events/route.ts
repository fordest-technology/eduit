import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const schoolId = session.role === "super_admin" ? searchParams.get("schoolId") || undefined : session.schoolId

    // If no schoolId is available, return empty array
    if (!schoolId) {
      return NextResponse.json([])
    }

    // Fetch events for the school
    const events = await prisma.event.findMany({
      where: {
        schoolId: schoolId as string,
        // For non-admin users, only show public events
        ...(session.role !== "super_admin" && session.role !== "school_admin" ? { isPublic: true } : {}),
      },
      orderBy: {
        startDate: "asc",
      },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session || (session.role !== "super_admin" && session.role !== "school_admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, startDate, endDate, location, isPublic, schoolId } = body

    // Validate required fields
    if (!title || !startDate) {
      return NextResponse.json({ error: "Title and start date are required" }, { status: 400 })
    }

    // Determine school ID
    const finalSchoolId = session.role === "super_admin" && schoolId ? schoolId : session.schoolId

    if (!finalSchoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 })
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        location,
        isPublic: isPublic ?? true,
        schoolId: finalSchoolId,
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}

