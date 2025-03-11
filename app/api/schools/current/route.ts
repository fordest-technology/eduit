import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // If user doesn't belong to a school, return empty response
    if (!session.schoolId) {
      return NextResponse.json({ school: null })
    }

    // Fetch school information
    const school = await prisma.school.findUnique({
      where: { id: session.schoolId },
      select: {
        id: true,
        name: true,
        shortName: true,
        address: true,
        phone: true,
        email: true,
        logo: true,
        subdomain: true,
        primaryColor: true,
        secondaryColor: true,
        _count: {
          select: {
            users: true,
            classes: true,
          },
        },
      },
    })

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 })
    }

    return NextResponse.json({ school })
  } catch (error) {
    console.error("Error fetching current school:", error)
    return NextResponse.json({ error: "Failed to fetch school information" }, { status: 500 })
  }
}

