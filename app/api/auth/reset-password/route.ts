import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { generateResetCode } from "@/lib/utils";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        school: {
          select: {
            name: true,
          }
        }
      },
    });

    if (!user) {
      // For security, don't reveal that the email doesn't exist
      return NextResponse.json(
        {
          success: true,
          message:
            "If your email is registered, you will receive a verification code shortly.",
        },
        { status: 200 }
      );
    }

    // Generate 4-digit reset code
    const resetCode = generateResetCode();

    // Hash the code and store it in the password field temporarily
    // This avoids the Prisma sync issues we've been having on Windows
    const hashedCode = await hash(resetCode, 10);

    // Update user: use the password field to store the code temporarily
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedCode,
      },
    });

    const schoolName = user.school?.name || "EduIT Institution";

    // Send email with the reset code
    const emailResult = await sendPasswordResetEmail({
      userName: user.name || "User",
      userEmail: email,
      resetCode: resetCode,
      schoolName: schoolName,
    });

    if (!emailResult.success) {
      console.error(
        `Failed to send password reset code to ${email}:`,
        emailResult.error
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Verification code sent. Please check your email.",
        ...(process.env.NODE_ENV !== "production" && !emailResult.success
          ? { devNote: `Email sending failed locally. Reset Code: ${resetCode}` }
          : {}),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
