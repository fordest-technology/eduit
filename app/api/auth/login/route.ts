import { type NextRequest, NextResponse } from "next/server"
import { compare } from "bcryptjs" // Changed from bcrypt to bcryptjs
import prisma from "@/lib/db"
import { signJwt, setSessionCookie, type UserJwtPayload } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Email and password are required",
        },
        { status: 400 },
      )
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        schoolId: true,
        profileImage: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 },
      )
    }

    // Verify password
    const passwordMatch = await compare(password, user.password)

    if (!passwordMatch) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 },
      )
    }

    // Get school information
    const school = user.schoolId
      ? await prisma.school.findUnique({
          where: { id: user.schoolId },
          select: {
            id: true,
            name: true,
            logo: true,
            subdomain: true,
            primaryColor: true,
            secondaryColor: true,
          },
        })
      : null

    // Create JWT payload
    const payload: UserJwtPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.toLowerCase() as any,
      schoolId: user.schoolId || undefined,
      profileImage: user.profileImage || undefined,
    }

    // Sign JWT
    const token = await signJwt(payload)

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          schoolId: user.schoolId,
          profileImage: user.profileImage,
        },
        school: school,
      },
      { status: 200 },
    )

    // Set cookie
    setSessionCookie(token, response)

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Authentication failed. Please try again.",
      },
      { status: 500 },
    )
  }
}

