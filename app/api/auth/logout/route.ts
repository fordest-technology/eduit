import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth-server";

export async function POST() {
  try {
    await deleteSession();
    
    const response = NextResponse.json({ success: true }, { status: 200 });
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
