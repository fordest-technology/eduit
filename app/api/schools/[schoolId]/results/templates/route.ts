import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const forbidden = () =>
  NextResponse.json({ error: "Forbidden" }, { status: 403 });

const templateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  content: z.any(), // Json
  isDefault: z.boolean().default(false),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const { schoolId } = await params;
  try {
    const session = await getSession();
    if (!session) return unauthorized();
    if (session.schoolId !== schoolId && session.role !== UserRole.SUPER_ADMIN) {
        return forbidden();
    }

    const templates = await prisma.resultTemplate.findMany({
      where: { schoolId },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const { schoolId } = await params;
  try {
    const session = await getSession();
    if (!session) return unauthorized();
    // Check permissions
    if (session.schoolId !== schoolId && session.role !== UserRole.SUPER_ADMIN) {
        return forbidden();
    }

    const body = await request.json();
    const validated = templateSchema.parse(body);

    const template = await prisma.resultTemplate.create({
      data: {
        ...validated,
        schoolId,
      }
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
