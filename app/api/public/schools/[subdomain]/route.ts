import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { subdomain: string } }
) {
  try {
    const subdomain = params.subdomain;

    if (!subdomain) {
      return NextResponse.json(
        { success: false, error: "Subdomain is required" },
        { status: 400 }
      );
    }

    console.log("Fetching school data for subdomain:", subdomain);

    const school = await prisma.school.findUnique({
      where: {
        subdomain: subdomain,
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        subdomain: true,
        logo: true,
        primaryColor: true,
        secondaryColor: true,
      },
    });

    if (!school) {
      console.log("School not found for subdomain:", subdomain);
      return NextResponse.json(
        { success: false, error: "School not found" },
        { status: 404 }
      );
    }

    console.log("School found:", school.name);

    // Add default colors if not set
    const schoolData = {
      ...school,
      primaryColor: school.primaryColor || "#f97316", // Default to orange
      secondaryColor: school.secondaryColor || "#16a34a", // Default to green
    };

    return NextResponse.json(
      { success: true, data: schoolData },
      {
        headers: {
          "Cache-Control": "public, max-age=3600", // Cache for 1 hour
        },
      }
    );
  } catch (error) {
    console.error("Error fetching school data:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
