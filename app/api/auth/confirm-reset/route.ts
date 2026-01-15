import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash, compare } from "bcryptjs";

export async function POST(request: NextRequest) {
    try {
        const { email, code, newPassword } = await request.json();

        if (!email || !code || !newPassword) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 400 });
        }

        // Verify the code (which is currently stored as the hashed password)
        const isValid = await compare(code, user.password);

        if (!isValid) {
            return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
        }

        // Hash the final new password
        const hashedPassword = await hash(newPassword, 10);

        // Update user password
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
            },
        });

        return NextResponse.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        console.error("Confirm reset error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
