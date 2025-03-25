import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    console.log("Public school endpoint called");
    const url = new URL(request.url);
    const schoolName = url.searchParams.get("school");
    console.log("School name from query:", schoolName);

    if (!schoolName) {
      console.error("No school name provided");
      return NextResponse.json(
        { error: "School name is required" },
        { status: 400 }
      );
    }

    console.log("Searching for school in database...");
    const school = await prisma.school.findFirst({
      where: {
        OR: [
          { name: { contains: schoolName, mode: "insensitive" } },
          { shortName: { contains: schoolName, mode: "insensitive" } },
        ],
      },
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

    console.log("Database query result:", school);

    if (!school) {
      console.error("School not found for name:", schoolName);
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    console.log("School found, returning data:", {
      name: school.name,
      primaryColor: school.primaryColor,
      secondaryColor: school.secondaryColor,
    });

    return NextResponse.json(school);
  } catch (error) {
    console.error("Error in public school endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
