import { Resend } from "resend";
import { render } from "@react-email/render";
import WaitlistAdminEmail from "@/emails/waitlist-admin-notification";
import WaitlistConfirmationEmail from "@/emails/waitlist-confirmation";
import WelcomeEmail from "@/emails/welcome-email";
import SchoolWelcomeEmail from "@/emails/school-welcome-email";
import PaymentNotificationEmail from "@/emails/payment-notification";
import ResultPublishedEmail from "@/emails/result-published-email";
import PasswordResetEmail from "@/emails/password-reset-email";
import AccountLinkageEmail from "@/emails/account-linkage-email";
import SubjectAssignmentEmail from "@/emails/subject-assignment-email";
import React from "react";

const resend = new Resend(process.env.RESEND_API_KEY);
const DEFAULT_FROM = "EduIT Global <onboarding@mail.fordestech.com>";

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
      const html = await render(React.createElement(WaitlistAdminEmail, data));
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
      const html = await render(React.createElement(WaitlistConfirmationEmail, { firstName }));
      return await resend.emails.send({
        from: "EduIT Ecosystem <welcome@mail.fordestech.com>",
        to: [email],
        subject: "Welcome to the EduIT Waitlist!",
        html,
      });
    } catch (error) {
      console.error("Failed to send waitlist confirmation email:", error);
    }
  },

  /**
   * Send welcome email to a new user (Teacher, Student, Parent, etc.)
   */
  async sendWelcomeEmail(data: {
    name: string;
    role: string;
    schoolName: string;
    schoolUrl: string;
    email: string;
    password?: string;
    isParent?: boolean;
    studentName?: string;
  }) {
    try {
      if (!process.env.RESEND_API_KEY) return;
      const html = await render(React.createElement(WelcomeEmail, data));
      return await resend.emails.send({
        from: DEFAULT_FROM,
        to: [data.email],
        subject: `Welcome to ${data.schoolName} - Your Portal Access`,
        html,
      });
    } catch (error) {
      console.error("Failed to send welcome email:", error);
    }
  },

  /**
   * Send school provisioning email to the school admin
   */
  async sendSchoolWelcomeEmail(data: {
    adminName: string;
    adminEmail: string;
    schoolName: string;
    schoolUrl: string;
    password?: string;
  }) {
    try {
      if (!process.env.RESEND_API_KEY) return;
      const html = await render(React.createElement(SchoolWelcomeEmail, data));
      return await resend.emails.send({
        from: "EduIT Provisioning <provisioning@mail.fordestech.com>",
        to: [data.adminEmail],
        subject: `Your Institution is Live: Welcome to EduIT`,
        html,
      });
    } catch (error) {
      console.error("Failed to send school welcome email:", error);
    }
  },

  /**
   * Send payment notification/receipt
   */
  async sendPaymentNotification(data: {
    to: string;
    recipientName: string;
    studentName: string;
    amount: number;
    billName: string;
    transactionRef: string;
    date: Date;
    schoolName: string;
    isParent: boolean;
  }) {
    try {
      if (!process.env.RESEND_API_KEY) return;
      const html = await render(React.createElement(PaymentNotificationEmail, data));
      return await resend.emails.send({
        from: `${data.schoolName} <billing@mail.fordestech.com>`,
        to: [data.to],
        subject: data.isParent 
          ? `Receipt: Payment for ${data.billName}` 
          : `Notification: Payment Received for ${data.billName}`,
        html,
      });
    } catch (error) {
      console.error("Failed to send payment notification email:", error);
    }
  },





  async sendSubjectAssignment(data: {
    teacherName: string;
    teacherEmail: string;
    subjectName: string;
    subjectCode?: string | null;
    schoolName: string;
    schoolUrl: string;
  }) {
    try {
      if (!process.env.RESEND_API_KEY) return;
      const html = await render(React.createElement(SubjectAssignmentEmail, data));
      return await resend.emails.send({
        from: `${data.schoolName} <academic@mail.fordestech.com>`,
        to: [data.teacherEmail],
        subject: `New Subject Assignment: ${data.subjectName}`,
        html,
      });
    } catch (error) {
      console.error("Failed to send subject assignment email:", error);
    }
  },

  async sendAccountLinkage(data: {
    parentName: string;
    parentEmail: string;
    studentName: string;
    schoolName: string;
    schoolUrl: string;
    relation?: string;
  }) {
    try {
      if (!process.env.RESEND_API_KEY) return;
      const html = await render(React.createElement(AccountLinkageEmail, {
        ...data,
        relation: data.relation || "Parent/Guardian"
      }));
      return await resend.emails.send({
        from: `${data.schoolName} <support@mail.fordestech.com>`,
        to: [data.parentEmail],
        subject: `Student Linked: ${data.studentName}`,
        html,
      });
    } catch (error) {
      console.error("Failed to send linkage email:", error);
    }
  },

  async sendPasswordResetCode(data: {
    userName: string;
    userEmail: string;
    resetCode: string;
    schoolName: string;
  }) {
    try {
      if (!process.env.RESEND_API_KEY) return;
      const html = await render(React.createElement(PasswordResetEmail, data));
      return await resend.emails.send({
        from: "EduIT Security <security@mail.fordestech.com>",
        to: [data.userEmail],
        subject: `Verification Code: ${data.resetCode}`,
        html,
      });
    } catch (error) {
      console.error("Failed to send password reset email:", error);
    }
  },

  async sendResultPublished(data: {
    studentName: string;
    studentEmail: string;
    parentName?: string;
    parentEmail?: string;
    periodName: string;
    sessionName: string;
    schoolName: string;
    schoolId: string;
  }) {
    try {
      if (!process.env.RESEND_API_KEY) return;
      
      // Map to component props
      const componentProps = {
        studentName: data.studentName,
        recipientName: data.parentName || data.studentName,
        periodName: data.periodName,
        sessionName: data.sessionName,
        schoolName: data.schoolName,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://eduit.app"
      };

      const html = await render(React.createElement(ResultPublishedEmail, componentProps));
      
      // Send to student
      await resend.emails.send({
        from: `${data.schoolName} <results@mail.fordestech.com>`,
        to: [data.studentEmail],
        subject: `Academic Results Released: ${data.periodName}`,
        html,
      });

      // Send to parent if exists
      if (data.parentEmail) {
        await resend.emails.send({
          from: `${data.schoolName} <results@mail.fordestech.com>`,
          to: [data.parentEmail],
          subject: `Academic Results Released: ${data.periodName}`,
          html,
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error("Failed to send result publication email:", error);
    }
  },

  /**
   * Generic send email for simple cases
   */
  async sendEmail(data: {
    to: string;
    subject: string;
    html: string;
    from?: string;
    replyTo?: string;
  }) {
    try {
      if (!process.env.RESEND_API_KEY) return;
      return await resend.emails.send({
        from: data.from || DEFAULT_FROM,
        to: [data.to],
        subject: data.subject,
        html: data.html,
        replyTo: data.replyTo,
      });
    } catch (error) {
      console.error("Failed to send generic email:", error);
      return { success: false, error: "Generic email sending failed" };
    }
  }
};
