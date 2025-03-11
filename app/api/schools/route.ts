import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Only super_admin can see all schools
    // School admins can only see their own school
    const where = session.role === "super_admin" ? {} : { id: session.schoolId }

    const schools = await prisma.school.findMany({
      where,
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        logo: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            classes: true,
          },
        },
      },
    })

    return NextResponse.json(schools)
  } catch (error) {
    console.error("Error fetching schools:", error)
    return NextResponse.json({ error: "Failed to fetch schools" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, address, phone, email, logo } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    // Check if email already exists
    const existingSchool = await prisma.school.findUnique({
      where: { email },
    })

    if (existingSchool) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 })
    }

    // Create school
    const school = await prisma.school.create({
      data: {
        name,
        address,
        phone,
        email,
        logo,
      },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        logo: true,
        createdAt: true,
      },
    })

    return NextResponse.json(school, { status: 201 })
  } catch (error) {
    console.error("Error creating school:", error)
    return NextResponse.json({ error: "Failed to create school" }, { status: 500 })
  }
}

