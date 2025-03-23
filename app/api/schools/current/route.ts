import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const school = await prisma.school.findUnique({
      where: {
        id: session.schoolId,
      },
      select: {
        id: true,
        name: true,
        logo: true,
        primaryColor: true,
        secondaryColor: true,
      },
    });

    if (!school) {
      return new NextResponse("School not found", { status: 404 });
    }

    return NextResponse.json({ school });
  } catch (error) {
    console.error("[SCHOOL_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
