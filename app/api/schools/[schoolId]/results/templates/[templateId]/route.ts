import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const forbidden = () =>
  NextResponse.json({ error: "Forbidden" }, { status: 403 });
const notFound = () =>
    NextResponse.json({ error: "Not Found" }, { status: 404 });

const templateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  content: z.any(), // Json
  isDefault: z.boolean().default(false),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ schoolId: string, templateId: string }> }
) {
  const { schoolId, templateId } = await params;
  try {
    const session = await getSession();
    if (!session) return unauthorized();
    if (session.schoolId !== schoolId && session.role !== UserRole.SUPER_ADMIN) {
        return forbidden();
    }

    const template = await prisma.resultTemplate.findUnique({
      where: { id: templateId, schoolId },
    });
    
    if (!template) return notFound();

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ schoolId: string, templateId: string }> }
) {
  const { schoolId, templateId } = await params;
  try {
    const session = await getSession();
    if (!session) return unauthorized();
    if (session.schoolId !== schoolId && session.role !== UserRole.SUPER_ADMIN) {
        return forbidden();
    }

    const body = await request.json();
    const validated = templateSchema.parse(body);

    const template = await prisma.resultTemplate.update({
      where: { id: templateId, schoolId },
      data: validated
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ schoolId: string, templateId: string }> }
) {
  const { schoolId, templateId } = await params;
  try {
    const session = await getSession();
    if (!session) return unauthorized();
    if (session.schoolId !== schoolId && session.role !== UserRole.SUPER_ADMIN) {
        return forbidden();
    }

    await prisma.resultTemplate.delete({
      where: { id: templateId, schoolId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
