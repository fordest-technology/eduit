import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

export async function POST(request: NextRequest) {
    try {
        const { email, code } = await request.json();

        if (!email || !code) {
            return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 400 });
        }

        // Check if the provided code matches the hashed code in the password field
        const isValid = await compare(code, user.password);

        if (!isValid) {
            return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
        }

        // Note: We don't check for expiration here because we're using the password field
        // In a prod system, we would check user.updatedAt to ensure the code is still fresh

        return NextResponse.json({ success: true, message: "Code verified" });
    } catch (error) {
        console.error("Verify code error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
