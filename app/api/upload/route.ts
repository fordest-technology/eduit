import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/cloudinary";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as string;

    if (!file) {
      return new NextResponse("No file provided", { status: 400 });
    }

    const imageUrl = await uploadImage(file);
    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error("[UPLOAD_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
