import ResetPasswordForm from "@/app/components/reset-password-form";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Reset Password | School Management System",
    description: "Reset your password to access your account",
};

export default function ResetPasswordPage() {
    return (
        <div className="container flex items-center justify-center min-h-screen py-12">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold mb-2">Reset Your Password</h1>
                    <p className="text-muted-foreground">
                        Enter your email to receive password reset instructions
                    </p>
                </div>
                <ResetPasswordForm />
            </div>
        </div>
    );
} 