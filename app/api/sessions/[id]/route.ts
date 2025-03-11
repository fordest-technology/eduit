import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const sessionId = params.id

    const academicSession = await prisma.academicSession.findUnique({
      where: { id: sessionId },
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            studentClasses: true,
            attendance: true,
            results: true,
          },
        },
      },
    })

    if (!academicSession) {
      return NextResponse.json({ error: "Academic session not found" }, { status: 404 })
    }

    // Check if user has permission to view this session
    if (session.role !== "super_admin" && academicSession.schoolId !== session.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(academicSession)
  } catch (error) {
    console.error("Error fetching academic session:", error)
    return NextResponse.json({ error: "Failed to fetch academic session" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()

  if (!session || (session.role !== "super_admin" && session.role !== "school_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const sessionId = params.id

    // Check if session exists and user has permission to update it
    const existingSession = await prisma.academicSession.findUnique({
      where: { id: sessionId },
      select: { schoolId: true },
    })

    if (!existingSession) {
      return NextResponse.json({ error: "Academic session not found" }, { status: 404 })
    }

    if (session.role !== "super_admin" && existingSession.schoolId !== session.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, startDate, endDate, isCurrent } = body

    // If setting as current, unset any other current sessions
    if (isCurrent) {
      await prisma.academicSession.updateMany({
        where: {
          schoolId: existingSession.schoolId,
          isCurrent: true,
          id: { not: sessionId },
        },
        data: {
          isCurrent: false,
        },
      })
    }

    // Update academic session
    const updatedSession = await prisma.academicSession.update({
      where: { id: sessionId },
      data: {
        ...(name ? { name } : {}),
        ...(startDate ? { startDate: new Date(startDate) } : {}),
        ...(endDate ? { endDate: new Date(endDate) } : {}),
        ...(isCurrent !== undefined ? { isCurrent } : {}),
      },
    })

    return NextResponse.json(updatedSession)
  } catch (error) {
    console.error("Error updating academic session:", error)
    return NextResponse.json({ error: "Failed to update academic session" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()

  if (!session || (session.role !== "super_admin" && session.role !== "school_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const sessionId = params.id

    // Check if session exists and user has permission to delete it
    const existingSession = await prisma.academicSession.findUnique({
      where: { id: sessionId },
      select: { schoolId: true },
    })

    if (!existingSession) {
      return NextResponse.json({ error: "Academic session not found" }, { status: 404 })
    }

    if (session.role !== "super_admin" && existingSession.schoolId !== session.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete academic session
    await prisma.academicSession.delete({
      where: { id: sessionId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting academic session:", error)
    return NextResponse.json({ error: "Failed to delete academic session" }, { status: 500 })
  }
}

