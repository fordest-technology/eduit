import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { schoolId } = await params

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        name: true,
        logo: true,
        primaryColor: true,
        secondaryColor: true,
      },
    })

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 })
    }

    return NextResponse.json(school, {
      headers: {
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error("Error fetching school branding:", error)
    return NextResponse.json(
      { error: "Failed to fetch school branding" },
      { status: 500 }
    )
  }
}
