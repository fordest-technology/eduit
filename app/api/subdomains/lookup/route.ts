import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSubdomain } from "@/lib/subdomain";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get("subdomain");

    if (!subdomain) {
      return NextResponse.json(
        { error: "Subdomain parameter is required" },
        { status: 400 }
      );
    }

    // Validate subdomain format
    const validation = validateSubdomain(subdomain);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Look up school by subdomain
    const school = await prisma.school.findUnique({
      where: { subdomain },
      select: { id: true },
    });

    return NextResponse.json({
      schoolId: school?.id || null,
      subdomain,
    });
  } catch (error) {
    console.error("Error looking up subdomain:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
