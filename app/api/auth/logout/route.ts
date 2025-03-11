import { type NextRequest, NextResponse } from "next/server"
import { removeSessionCookie } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true }, { status: 200 })

  removeSessionCookie(response)

  return response
}

