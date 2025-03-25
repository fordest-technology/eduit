import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { getDashboardStats } from "@/lib/prismadb";

export async function GET(req: Request) {
  const session = await getSession();

  if (!session || !session.schoolId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await getDashboardStats(session.schoolId);
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
