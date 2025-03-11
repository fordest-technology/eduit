import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const subjectId = params.id

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        teachers: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        classes: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                section: true,
              },
            },
          },
        },
      },
    })

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    // Check if user has permission to view this subject
    if (session.role !== "super_admin" && subject.schoolId !== session.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(subject)
  } catch (error) {
    console.error("Error fetching subject:", error)
    return NextResponse.json({ error: "Failed to fetch subject" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()

  if (!session || (session.role !== "super_admin" && session.role !== "school_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const subjectId = params.id

    // Check if subject exists and user has permission to update it
    const existingSubject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { schoolId: true },
    })

    if (!existingSubject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    if (session.role !== "super_admin" && existingSubject.schoolId !== session.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, code, description } = body

    // Update subject
    const updatedSubject = await prisma.subject.update({
      where: { id: subjectId },
      data: {
        ...(name ? { name } : {}),
        ...(code !== undefined ? { code } : {}),
        ...(description !== undefined ? { description } : {}),
      },
    })

    return NextResponse.json(updatedSubject)
  } catch (error) {
    console.error("Error updating subject:", error)
    return NextResponse.json({ error: "Failed to update subject" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()

  if (!session || (session.role !== "super_admin" && session.role !== "school_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const subjectId = params.id

    // Check if subject exists and user has permission to delete it
    const existingSubject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { schoolId: true },
    })

    if (!existingSubject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    if (session.role !== "super_admin" && existingSubject.schoolId !== session.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete subject
    await prisma.subject.delete({
      where: { id: subjectId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting subject:", error)
    return NextResponse.json({ error: "Failed to delete subject" }, { status: 500 })
  }
}

