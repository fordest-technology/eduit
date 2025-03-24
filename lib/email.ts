import nodemailer from "nodemailer";
import db from "@/lib/db";
import { generateEmailDebugId } from "@/lib/utils";

// Create the transporter with proper configuration
const createTransporter = () => {
  // Check if we have all required SMTP configuration
  // Support both EMAIL_* and SMTP_* variable naming
  const emailHost = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const emailPort = process.env.EMAIL_PORT || process.env.SMTP_PORT;
  const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
  const emailPassword = process.env.EMAIL_PASSWORD || process.env.SMTP_PASS;

  if (emailHost && emailPort && emailUser && emailPassword) {
    return nodemailer.createTransport({
      host: emailHost,
      port: Number.parseInt(emailPort || "587"),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
  }

  // If no SMTP config, use a production-ready alternative if in production
  if (process.env.NODE_ENV === "production") {
    // For production, you should use a reliable service
    // This is just an example using a different provider's configuration
    if (
      process.env.ALTERNATIVE_EMAIL_SERVICE === "sendgrid" &&
      process.env.SENDGRID_API_KEY
    ) {
      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: "apikey",
          pass: process.env.SENDGRID_API_KEY,
        },
      });
    } else if (
      process.env.ALTERNATIVE_EMAIL_SERVICE === "mailgun" &&
      process.env.MAILGUN_API_KEY
    ) {
      // Set up Mailgun or other alternatives
      // You may need to install additional packages based on your choice
      return nodemailer.createTransport({
        service: "Mailgun",
        auth: {
          user: process.env.MAILGUN_USER,
          pass: process.env.MAILGUN_API_KEY,
        },
      });
    }

    // Throw error if no email service is configured in production
    throw new Error(
      "No email service is configured. Please configure SMTP or an alternative email service."
    );
  }

  // For development, return a mock transporter that logs instead of sending
  return {
    sendMail: async (mailOptions: nodemailer.SendMailOptions) => {
      console.log(
        "DEV MODE: Would send email with these options:",
        mailOptions
      );
      return { messageId: `dev-${Date.now()}` };
    },
  };
};

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: any[];
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  debugId?: string;
}

/**
 * Sends an email using the configured SMTP server
 * @param options Email options including recipient, subject, and content
 */
export async function sendEmail(
  options: EmailOptions
): Promise<{ success: boolean; error?: string }> {
  const {
    to,
    subject,
    html,
    from = process.env.EMAIL_FROM || "noreply@school.com",
    replyTo = process.env.EMAIL_REPLY_TO || "support@school.com",
    attachments = [],
  } = options;

  // In development mode, just log the email rather than sending it
  if (process.env.NODE_ENV !== "production") {
    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
    console.log(`📧 DEV MODE EMAIL: Would send to ${to}`);
    console.log(`📧 Subject: ${subject}`);
    console.log(`📧 From: ${from}`);
    console.log("📧 Content: [HTML content omitted for clarity]");
    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    // Log to file in development for inspection
    try {
      const fs = require("fs");
      const path = require("path");
      const debugDir = path.join(process.cwd(), ".debug-emails");

      if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = path.join(debugDir, `email-${timestamp}.html`);
      fs.writeFileSync(filename, html);
      console.log(`📧 Debug email saved to ${filename}`);
    } catch (err) {
      console.warn("Could not save debug email to file", err);
    }

    return { success: true };
  }

  try {
    // Configure Nodemailer transport
    const transporter = createTransporter();

    // Add retry mechanism
    let retries = 3;
    let lastError: any = null;

    while (retries > 0) {
      try {
        // Send the email
        await transporter.sendMail({
          from,
          to,
          replyTo,
          subject,
          html,
          attachments,
        });

        console.log(`Email sent successfully to ${to}`);
        return { success: true };
      } catch (error) {
        lastError = error;
        retries--;
        if (retries > 0) {
          console.log(
            `Email sending failed, retrying (${retries} retries left)...`
          );
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retrying
        }
      }
    }

    // All retries failed
    console.error("Error sending email after multiple retries:", lastError);
    return {
      success: false,
      error: lastError?.message || "Unknown email error",
    };
  } catch (error: any) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error?.message || "Unknown email error",
    };
  }
}

interface WelcomeEmailParams {
  name: string;
  email: string;
  role: string;
  schoolName: string;
  schoolUrl: string;
  password: string;
  schoolId?: string;
  debugId?: string;
}

export async function sendWelcomeEmail({
  name,
  email,
  role,
  schoolName,
  schoolUrl,
  password,
  schoolId,
  debugId,
}: WelcomeEmailParams) {
  const subject = `Welcome to EduIT - ${schoolName}`;

  // Get school colors if schoolId is provided
  let primaryColor = "#22c55e";
  let secondaryColor = "#4f46e5";
  let logoUrl = "https://eduit.app/logo.png";

  if (schoolId) {
    try {
      const school = await db.school.findUnique({
        where: { id: schoolId },
        select: {
          primaryColor: true,
          secondaryColor: true,
          logo: true,
        },
      });

      if (school) {
        primaryColor = school.primaryColor || primaryColor;
        secondaryColor = school.secondaryColor || secondaryColor;
        logoUrl = school.logo || logoUrl;
      }
    } catch (error) {
      console.error("Error fetching school colors for email:", error);
    }
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: ${primaryColor}; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .header img { max-height: 60px; margin-bottom: 10px; }
        .content { padding: 30px 20px; }
        .footer { background-color: #f7f7f7; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
        h1 { color: #ffffff; font-size: 24px; margin: 0; font-weight: 600; }
        h2 { color: ${primaryColor}; font-size: 20px; margin-top: 0; }
        p { color: #333; line-height: 1.5; }
        .credentials { background-color: #f7f7f7; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .credentials p { margin: 5px 0; }
        .credentials span { font-weight: bold; color: ${secondaryColor}; }
        .button { display: inline-block; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-weight: 500; margin-top: 15px; }
        .warning { margin-top: 20px; padding: 12px; background-color: #fff8e1; border-left: 4px solid #ffc107; color: #5d4037; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="${schoolName} Logo" />
          <h1>Welcome to EduIT</h1>
        </div>
        <div class="content">
          <h2>Hello, ${name}!</h2>
          <p>You have been registered as a <strong>${role}</strong> for <strong>${schoolName}</strong>.</p>
          
          <div class="credentials">
            <h3 style="margin-top: 0;">Your Login Credentials</h3>
            <p><span>School URL:</span> <a href="${schoolUrl}" style="color: ${primaryColor};">${schoolUrl}</a></p>
            <p><span>Email:</span> ${email}</p>
            <p><span>Password:</span> ${password}</p>
          </div>
          
          <div class="warning">
            <p style="margin: 0;">Please log in and change your password as soon as possible for security reasons.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${schoolUrl}" class="button">Login Now</a>
          </div>
        </div>
        <div class="footer">
          <p>If you have any questions, please contact support at <a href="mailto:support@eduit.com" style="color: ${primaryColor};">support@eduit.com</a></p>
          <p>&copy; ${new Date().getFullYear()} EduIT. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail({
      to: email,
      subject,
      html,
      // debugId,
    });
    return result;
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    throw error;
  }
}

interface StudentCredentialsEmailParams {
  studentName: string;
  parentName?: string;
  studentEmail: string;
  parentEmail?: string;
  password: string;
  schoolName: string;
  schoolUrl: string;
  schoolId?: string;
}

export async function sendStudentCredentialsEmail({
  studentName,
  parentName,
  studentEmail,
  parentEmail,
  password,
  schoolName,
  schoolUrl,
  schoolId,
}: StudentCredentialsEmailParams) {
  const subject = `Your EduIT Account for ${schoolName}`;

  // Get school colors if schoolId is provided
  let primaryColor = "#22c55e";
  let secondaryColor = "#4f46e5";
  let logoUrl = "https://eduit.app/logo.png";

  if (schoolId) {
    try {
      const school = await db.school.findUnique({
        where: { id: schoolId },
        select: {
          primaryColor: true,
          secondaryColor: true,
          logo: true,
        },
      });

      if (school) {
        primaryColor = school.primaryColor || primaryColor;
        secondaryColor = school.secondaryColor || secondaryColor;
        logoUrl = school.logo || logoUrl;
      }
    } catch (error) {
      console.error("Error fetching school colors for email:", error);
    }
  }

  const studentHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: ${primaryColor}; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .header img { max-height: 60px; margin-bottom: 10px; }
        .content { padding: 30px 20px; }
        .footer { background-color: #f7f7f7; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
        h1 { color: #ffffff; font-size: 24px; margin: 0; font-weight: 600; }
        h2 { color: ${primaryColor}; font-size: 20px; margin-top: 0; }
        p { color: #333; line-height: 1.5; }
        .credentials { background-color: #f7f7f7; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .credentials p { margin: 5px 0; }
        .credentials span { font-weight: bold; color: ${secondaryColor}; }
        .button { display: inline-block; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-weight: 500; margin-top: 15px; }
        .warning { margin-top: 20px; padding: 12px; background-color: #fff8e1; border-left: 4px solid #ffc107; color: #5d4037; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="${schoolName} Logo" />
          <h1>Your Student Account</h1>
        </div>
        <div class="content">
          <h2>Hello, ${studentName}!</h2>
          <p>An account has been created for you at <strong>${schoolName}</strong>.</p>
          
          <div class="credentials">
            <h3 style="margin-top: 0;">Your Login Credentials</h3>
            <p><span>School URL:</span> <a href="${schoolUrl}" style="color: ${primaryColor};">${schoolUrl}</a></p>
            <p><span>Email:</span> ${studentEmail}</p>
            <p><span>Password:</span> ${password}</p>
          </div>
          
          <div class="warning">
            <p style="margin: 0;">Please log in and change your password as soon as possible for security reasons.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${schoolUrl}" class="button">Login Now</a>
          </div>
        </div>
        <div class="footer">
          <p>If you have any questions, please contact your school administrator.</p>
          <p>&copy; ${new Date().getFullYear()} EduIT. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Send email to student
  await sendEmail({ to: studentEmail, subject, html: studentHtml });

  // If parent email is provided, send them an email too
  if (parentName && parentEmail) {
    const parentSubject = `Your Child's EduIT Account for ${schoolName}`;

    const parentHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background-color: ${primaryColor}; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .header img { max-height: 60px; margin-bottom: 10px; }
          .content { padding: 30px 20px; }
          .footer { background-color: #f7f7f7; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
          h1 { color: #ffffff; font-size: 24px; margin: 0; font-weight: 600; }
          h2 { color: ${primaryColor}; font-size: 20px; margin-top: 0; }
          p { color: #333; line-height: 1.5; }
          .credentials { background-color: #f7f7f7; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .credentials p { margin: 5px 0; }
          .credentials span { font-weight: bold; color: ${secondaryColor}; }
          .button { display: inline-block; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-weight: 500; margin-top: 15px; }
          .info { margin-top: 20px; padding: 12px; background-color: #e3f2fd; border-left: 4px solid #2196f3; color: #0d47a1; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${logoUrl}" alt="${schoolName} Logo" />
            <h1>Your Child's Account</h1>
          </div>
          <div class="content">
            <h2>Hello, ${parentName}!</h2>
            <p>An account has been created for your child, <strong>${studentName}</strong>, at <strong>${schoolName}</strong>.</p>
            
            <div class="credentials">
              <h3 style="margin-top: 0;">Your Child's Login Credentials</h3>
              <p><span>School URL:</span> <a href="${schoolUrl}" style="color: ${primaryColor};">${schoolUrl}</a></p>
              <p><span>Email:</span> ${studentEmail}</p>
              <p><span>Password:</span> ${password}</p>
            </div>
            
            <div class="info">
              <p style="margin: 0;">You can also log in with your own parent account to monitor your child's progress.</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${schoolUrl}" class="button">Visit School Portal</a>
            </div>
          </div>
          <div class="footer">
            <p>If you have any questions, please contact the school administrator.</p>
            <p>&copy; ${new Date().getFullYear()} EduIT. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: parentEmail,
      subject: parentSubject,
      html: parentHtml,
    });
  }

  return true;
}

interface TeacherCredentialsEmailParams {
  name: string;
  email: string;
  password: string;
  schoolName: string;
  schoolUrl: string;
  schoolId?: string;
}

export async function sendTeacherCredentialsEmail({
  name,
  email,
  password,
  schoolName,
  schoolUrl,
  schoolId,
}: TeacherCredentialsEmailParams) {
  const subject = `Your EduIT Teacher Account for ${schoolName}`;

  // Get school colors if schoolId is provided
  let primaryColor = "#22c55e";
  let secondaryColor = "#4f46e5";
  let logoUrl = "https://eduit.app/logo.png";

  if (schoolId) {
    try {
      const school = await db.school.findUnique({
        where: { id: schoolId },
        select: {
          primaryColor: true,
          secondaryColor: true,
          logo: true,
        },
      });

      if (school) {
        primaryColor = school.primaryColor || primaryColor;
        secondaryColor = school.secondaryColor || secondaryColor;
        logoUrl = school.logo || logoUrl;
      }
    } catch (error) {
      console.error("Error fetching school colors for email:", error);
    }
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 5px; }
        .header { background-color: ${primaryColor}; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .header img { max-height: 60px; margin-bottom: 10px; }
        .content { padding: 30px 20px; }
        .footer { background-color: #f7f7f7; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
        h1 { color: #ffffff; font-size: 24px; margin: 0; font-weight: 600; }
        h2 { color: ${primaryColor}; font-size: 20px; margin-top: 0; }
        p { color: #333; line-height: 1.5; }
        .credentials { background-color: #f7f7f7; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .credentials p { margin: 5px 0; }
        .credentials span { font-weight: bold; color: ${secondaryColor}; }
        .button { display: inline-block; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-weight: 500; margin-top: 15px; }
        .warning { margin-top: 20px; padding: 12px; background-color: #fff8e1; border-left: 4px solid #ffc107; color: #5d4037; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="${schoolName} Logo" />
          <h1>Your Teacher Account</h1>
        </div>
        <div class="content">
          <h2>Hello, ${name}!</h2>
          <p>Welcome to the EduIT platform. An account has been created for you as a teacher at <strong>${schoolName}</strong>.</p>
          
          <div class="credentials">
            <h3 style="margin-top: 0;">Your Login Credentials</h3>
            <p><span>School URL:</span> <a href="${schoolUrl}" style="color: ${primaryColor};">${schoolUrl}</a></p>
            <p><span>Email:</span> ${email}</p>
            <p><span>Password:</span> ${password}</p>
          </div>
          
          <div class="warning">
            <p style="margin: 0;">Please log in and change your password as soon as possible for security reasons.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${schoolUrl}" class="button">Access Your Account</a>
          </div>
        </div>
        <div class="footer">
          <p>If you have any questions, please contact the school administrator.</p>
          <p>&copy; ${new Date().getFullYear()} EduIT. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: email, subject, html });
}
