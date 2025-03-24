import { db } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const results = await db.result.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        report: true,
      },
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error("Failed to fetch results:", error)
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, schoolLevel, score } = body

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 })
    }

    const result = await db.result.create({
      data: {
        title,
        description,
        schoolLevel,
        score: score ? Number(score) : undefined,
        status: "pending",
      },
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Failed to create result:", error)
    return NextResponse.json({ error: "Failed to create result" }, { status: 500 })
  }
}

