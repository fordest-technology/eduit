import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { generatePassword } from "@/lib/utils";
import { sendEmail } from "@/lib/email";

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
        parent: true,
      },
    });

    if (!user) {
      // For security, don't reveal that the email doesn't exist
      return NextResponse.json(
        {
          success: true,
          message:
            "If your email is registered, you will receive password reset instructions shortly.",
        },
        { status: 200 }
      );
    }

    // Generate new secure password
    const newPassword = generatePassword(12);
    const hashedPassword = await hash(newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Get school info for email branding
    const school = user.schoolId
      ? await prisma.school.findUnique({
          where: { id: user.schoolId },
          select: { name: true },
        })
      : null;

    const schoolName = school?.name || "School";

    // Send email with new password
    const emailResult = await sendEmail({
      to: email,
      subject: `${schoolName} Password Reset`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Password Reset</h2>
          <p>Dear ${user.name},</p>
          <p>Your password has been reset as requested. Here are your new login credentials:</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>New Password:</strong> ${newPassword}</p>
          <p><a href="${
            process.env.NEXT_PUBLIC_APP_URL || "https://school-domain.com"
          }/auth/signin" 
                style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
             Login to Your Account
          </a></p>
          <p>For security reasons, please change your password after logging in.</p>
          <p>If you did not request this password reset, please contact the school administrator immediately.</p>
          <p>Thank you,<br>${schoolName} Team</p>
        </div>
      `,
    });

    // If email sending failed, log the error but don't expose it to the user
    if (!emailResult.success) {
      console.error(
        `Failed to send password reset email to ${email}:`,
        emailResult.error
      );

      // In development, provide the password for testing purposes
      if (process.env.NODE_ENV !== "production") {
        console.log(`DEV MODE - New password for ${email}: ${newPassword}`);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "If your email is registered, you will receive password reset instructions shortly.",
        // Only in development, include the new password if email failed
        ...(process.env.NODE_ENV !== "production" && !emailResult.success
          ? { devNote: `Email sending failed. New password: ${newPassword}` }
          : {}),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
