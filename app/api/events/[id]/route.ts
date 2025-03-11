import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const eventId = params.id

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if user has permission to view this event
    if (session.role !== "super_admin" && event.schoolId !== session.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // If user is not an admin and event is not public, deny access
    if (session.role !== "super_admin" && session.role !== "school_admin" && !event.isPublic) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error fetching event:", error)
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()

    if (!session || (session.role !== "super_admin" && session.role !== "school_admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const eventId = params.id
    const body = await request.json()
    const { title, description, startDate, endDate, location, isPublic, schoolId } = body

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if user has permission to update this event
    if (session.role !== "super_admin" && existingEvent.schoolId !== session.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        title,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        location,
        isPublic: isPublic ?? true,
        ...(session.role === "super_admin" && schoolId ? { schoolId } : {}),
      },
    })

    return NextResponse.json(updatedEvent)
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()

    if (!session || (session.role !== "super_admin" && session.role !== "school_admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const eventId = params.id

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if user has permission to delete this event
    if (session.role !== "super_admin" && existingEvent.schoolId !== session.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete event
    await prisma.event.delete({
      where: { id: eventId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}

