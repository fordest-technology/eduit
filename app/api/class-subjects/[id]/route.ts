import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()

  if (!session || (session.role !== "super_admin" && session.role !== "school_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const assignmentId = params.id

    // Check if assignment exists
    const assignment = await prisma.classSubject.findUnique({
      where: { id: assignmentId },
      include: {
        class: {
          select: { schoolId: true },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    // Check if user has permission to remove this assignment
    if (session.role !== "super_admin" && assignment.class.schoolId !== session.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete assignment
    await prisma.classSubject.delete({
      where: { id: assignmentId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing subject from class:", error)
    return NextResponse.json({ error: "Failed to remove subject from class" }, { status: 500 })
  }
}

