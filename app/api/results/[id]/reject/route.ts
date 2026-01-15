import { prisma } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-client"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession(null)

    if (!session || (session.role !== 'SCHOOL_ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { comment } = await request.json().catch(() => ({ comment: "" }))

    // Check if result exists
    const existingResult = await prisma.result.findUnique({
      where: { id },
    })

    if (!existingResult) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 })
    }

    // Update result: clear approval and add admin comment
    const updatedResult = await prisma.result.update({
      where: { id },
      data: {
        approvedById: null,
        adminComment: comment || "Result was rejected by administrator",
      },
      include: {
        student: {
          include: {
            user: {
              select: { name: true }
            }
          }
        },
        subject: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Result for ${updatedResult.student.user.name} in ${updatedResult.subject.name} has been rejected`,
      result: updatedResult
    })
  } catch (error) {
    console.error(`Failed to reject result with id ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to reject result" }, { status: 500 })
  }
}

