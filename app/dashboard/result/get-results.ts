import { db } from "@/lib/db"
import type { Result } from "./types"

export async function getResults(): Promise<Result[]> {
  try {
    const results = await db.result.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        report: true,
      },
    })

    return results.map((result) => ({
      id: result.id,
      title: result.title,
      description: result.description,
      status: result.status as "pending" | "approved" | "rejected",
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      schoolLevel: result.schoolLevel || undefined,
      score: result.score || undefined,
      reportId: result.report?.id,
    }))
  } catch (error) {
    console.error("Failed to fetch results:", error)
    return []
  }
}

export async function getResultById(id: string): Promise<Result | null> {
  try {
    const result = await db.result.findUnique({
      where: { id },
      include: {
        report: true,
      },
    })

    if (!result) return null

    return {
      id: result.id,
      title: result.title,
      description: result.description,
      status: result.status as "pending" | "approved" | "rejected",
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      schoolLevel: result.schoolLevel || undefined,
      score: result.score || undefined,
      reportId: result.report?.id,
    }
  } catch (error) {
    console.error(`Failed to fetch result with id ${id}:`, error)
    return null
  }
}

