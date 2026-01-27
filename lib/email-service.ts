import { Resend } from "resend";
import { render } from "@react-email/render";
import WaitlistAdminEmail from "@/emails/waitlist-admin-notification";
import WaitlistConfirmationEmail from "@/emails/waitlist-confirmation";
import React from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

export const emailService = {
  /**
   * Send notification to admins about a new waitlist signup
   */
  async sendWaitlistAdminNotification(data: {
    firstName: string;
    lastName: string;
    email: string;
    schoolName: string;
    studentPopulation: string;
  }) {
    try {
      if (!process.env.RESEND_API_KEY) return;

      const html = await render(
        React.createElement(WaitlistAdminEmail, data)
      );

      return await resend.emails.send({
        from: "EduIT System <system@mail.fordestech.com>",
        to: ["ololadetimileyin3@gmail.com", "johnayomide50@gmail.com", "fordestechnologies@gmail.com"],
        subject: `New Waitlist Signup: ${data.schoolName}`,
        html,
      });
    } catch (error) {
      console.error("Failed to send admin notification email:", error);
    }
  },

  /**
   * Send confirmation to the user who joined the waitlist
   */
  async sendWaitlistConfirmation(email: string, firstName: string) {
    try {
      if (!process.env.RESEND_API_KEY) return;

      const html = await render(
        React.createElement(WaitlistConfirmationEmail, { firstName })
      );

      return await resend.emails.send({
        from: "EduIT Ecosystem <welcome@mail.fordestech.com>",
        to: [email],
        subject: "Welcome to the EduIT Waitlist!",
        html,
      });
    } catch (error) {
      console.error("Failed to send waitlist confirmation email:", error);
    }
  }
};
