import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// In-memory cache for school data
interface SchoolCache {
  data: any;
  timestamp: number;
}

const schoolCache = new Map<string, SchoolCache>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

async function getSchoolBySubdomain(subdomain: string) {
  const now = Date.now();
  const cached = schoolCache.get(subdomain);

  // Return cached data if still valid
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Fetch from database with minimal fields
  const school = await prisma.school.findUnique({
    where: { subdomain },
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

  if (school) {
    // Cache the result
    schoolCache.set(subdomain, {
      data: school,
      timestamp: now,
    });
  }

  return school;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const startTime = Date.now();

  try {
    const { subdomain } = await params;

    if (!subdomain) {
      return NextResponse.json(
        { success: false, error: "Subdomain is required" },
        { status: 400 }
      );
    }

    const school = await getSchoolBySubdomain(subdomain);

    if (!school) {
      return NextResponse.json(
        { success: false, error: "School not found" },
        { status: 404 }
      );
    }

    // Add default colors if not set
    const schoolData = {
      ...school,
      primaryColor: school.primaryColor || "#f97316",
      secondaryColor: school.secondaryColor || "#16a34a",
    };

    const duration = Date.now() - startTime;
    console.log(`School lookup for "${subdomain}" completed in ${duration}ms`);

    return NextResponse.json(
      { success: true, data: schoolData },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          "X-Response-Time": `${duration}ms`,
        },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Error fetching school data (${duration}ms):`, error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
