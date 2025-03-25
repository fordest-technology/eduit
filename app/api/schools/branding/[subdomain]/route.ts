import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { subdomain: string } }
) {
  try {
    // Validate subdomain
    if (!params.subdomain) {
      return NextResponse.json(
        { error: "Subdomain is required" },
        { status: 400 }
      );
    }

    const school = await prisma.school.findUnique({
      where: { subdomain: params.subdomain },
      select: {
        id: true,
        name: true,
        subdomain: true,
        shortName: true,
        logo: true,
        primaryColor: true,
        secondaryColor: true,
      },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Only return public branding data
    const publicBranding = {
      name: school.name,
      subdomain: school.subdomain,
      shortName: school.shortName,
      logo: school.logo,
      primaryColor: school.primaryColor,
      secondaryColor: school.secondaryColor,
    };

    // Set cache headers for better performance
    const response = NextResponse.json(publicBranding);
    response.headers.set("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    return response;
  } catch (error) {
    console.error("Error fetching school branding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
