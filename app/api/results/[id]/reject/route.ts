import { db } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Check if result exists
    const existingResult = await db.result.findUnique({
      where: { id },
    })

    if (!existingResult) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 })
    }

    // Update result status to rejected
    const updatedResult = await db.result.update({
      where: { id },
      data: {
        status: "rejected",
      },
    })

    return NextResponse.json(updatedResult)
  } catch (error) {
    console.error(`Failed to reject result with id ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to reject result" }, { status: 500 })
  }
}

