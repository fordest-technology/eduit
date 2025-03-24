"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createResult(formData: FormData) {
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const schoolLevel = formData.get("schoolLevel") as string | null
  const score = formData.get("score") ? Number(formData.get("score")) : null

  if (!title || !description) {
    throw new Error("Title and description are required")
  }

  try {
    await db.result.create({
      data: {
        title,
        description,
        schoolLevel: schoolLevel || undefined,
        score: score || undefined,
        status: "pending",
      },
    })

    revalidatePath("/dashboard/resultl")
    redirect("/dashboard/resultl")
  } catch (error) {
    console.error("Failed to create result:", error)
    throw new Error("Failed to create result")
  }
}

export async function generateReport(resultId: string) {
  try {
    // Check if result exists
    const result = await db.result.findUnique({
      where: { id: resultId },
      include: { report: true },
    })

    if (!result) {
      throw new Error("Result not found")
    }

    // If report already exists, return it
    if (result.report) {
      return result.report
    }

    // Generate report content based on result data
    const reportContent = `
      # Report for ${result.title}
      
      ## Details
      - Status: ${result.status}
      - School Level: ${result.schoolLevel || "Not specified"}
      - Score: ${result.score !== null ? result.score : "Not scored"}
      
      ## Description
      ${result.description}
      
      ## Analysis
      This is an automatically generated report for the result "${result.title}".
      The result was created on ${result.createdAt.toLocaleDateString()}.
    `

    // Create report in database
    const report = await db.report.create({
      data: {
        content: reportContent,
        resultId: resultId,
      },
    })

    revalidatePath(`/dashboard/resultl`)
    return report
  } catch (error) {
    console.error("Failed to generate report:", error)
    throw new Error("Failed to generate report")
  }
}

export async function approveResult(resultId: string) {
  try {
    await db.result.update({
      where: { id: resultId },
      data: { status: "approved" },
    })

    revalidatePath("/dashboard/resultl")
    return { success: true }
  } catch (error) {
    console.error("Failed to approve result:", error)
    throw new Error("Failed to approve result")
  }
}

export async function rejectResult(resultId: string) {
  try {
    await db.result.update({
      where: { id: resultId },
      data: { status: "rejected" },
    })

    revalidatePath("/dashboard/resultl")
    return { success: true }
  } catch (error) {
    console.error("Failed to reject result:", error)
    throw new Error("Failed to reject result")
  }
}

