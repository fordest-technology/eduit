import { db } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"
import { billingService } from "@/lib/billing-service"
import { BillingStatus } from "@prisma/client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { resultId } = body

    if (!resultId) {
      return NextResponse.json({ error: "Result ID is required" }, { status: 400 })
    }

    // Check if result exists and get schoolId
    const result = await db.result.findUnique({
      where: { id: resultId },
      include: { 
        report: true,
        student: {
          include: {
            user: {
              select: { schoolId: true }
            }
          }
        }
      },
    })

    if (!result) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 })
    }

    const schoolId = result.student.user.schoolId;
    if (schoolId) {
      const billingInfo = await billingService.getBillingInfo(schoolId);
      if (billingInfo.billingStatus === BillingStatus.BLOCKED) {
        return NextResponse.json(
          { 
            message: "Account Blocked: Please complete your usage payment to continue using core features like report generation.",
            billingInfo 
          },
          { status: 403 }
        );
      }
    }

    // If report already exists, return it
    if (result.report) {
      return NextResponse.json(result.report)
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

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error("Failed to generate report:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const resultId = url.searchParams.get("resultId")

    if (!resultId) {
      return NextResponse.json({ error: "Result ID is required" }, { status: 400 })
    }

    const report = await db.report.findFirst({
      where: { resultId },
    })

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error("Failed to fetch report:", error)
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 })
  }
}

