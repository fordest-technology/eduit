import { db } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const result = await db.result.findUnique({
      where: { id },
      include: {
        report: true,
      },
    })

    if (!result) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error(`Failed to fetch result with id ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to fetch result" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()
    const { title, description, schoolLevel, score, status } = body

    // Check if result exists
    const existingResult = await db.result.findUnique({
      where: { id },
    })

    if (!existingResult) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 })
    }

    // Update result
    const updatedResult = await db.result.update({
      where: { id },
      data: {
        title,
        description,
        schoolLevel,
        score: score !== undefined ? Number(score) : undefined,
        status,
      },
    })

    return NextResponse.json(updatedResult)
  } catch (error) {
    console.error(`Failed to update result with id ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to update result" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Check if result exists
    const existingResult = await db.result.findUnique({
      where: { id },
    })

    if (!existingResult) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 })
    }

    // Delete result
    await db.result.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Failed to delete result with id ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to delete result" }, { status: 500 })
  }
}

