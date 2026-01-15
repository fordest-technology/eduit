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

    // Check if result exists
    const existingResult = await prisma.result.findUnique({
      where: { id },
    })

    if (!existingResult) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 })
    }

    // Update result to be approved by current user
    const updatedResult = await prisma.result.update({
      where: { id },
      data: {
        approvedById: session.id,
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
      message: `Result for ${updatedResult.student.user.name} in ${updatedResult.subject.name} has been approved`,
      result: updatedResult
    })
  } catch (error) {
    console.error(`Failed to approve result with id ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to approve result" }, { status: 500 })
  }
}

