import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export async function POST(req: NextRequest) {
  let waitlistPrisma: PrismaClient | null = null;
  try {
    const body = await req.json();
    const { firstName, lastName, email, schoolName, studentPopulation } = body;

    if (!process.env.WAITLIST_DATABASE_URL) {
      throw new Error("WAITLIST_DATABASE_URL is not defined");
    }

    waitlistPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.WAITLIST_DATABASE_URL
        }
      }
    });

    // Create table if not exists
    await waitlistPrisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS waitlist (
        id SERIAL PRIMARY KEY,
        first_name TEXT,
        last_name TEXT,
        email TEXT UNIQUE,
        school_name TEXT,
        student_population TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert data
    await waitlistPrisma.$executeRawUnsafe(
      `INSERT INTO waitlist (first_name, last_name, email, school_name, student_population) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (email) DO UPDATE SET 
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         school_name = EXCLUDED.school_name,
         student_population = EXCLUDED.student_population;`,
      firstName, lastName, email, schoolName, studentPopulation
    );

    // Send Notification Emails
    try {
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        await resend.emails.send({
          from: "EduIT Waitlist <onboarding@resend.dev>", // Using Resend default for now as standard
          to: ["ololadetimileyin3@gmail.com", "johnayomide50@gmail.com", "fordestechnologies@gmail.com"],
          subject: "New Waitlist Signup: " + schoolName,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #f97316;">New Waitlist Entry</h2>
              <p>A new institution has joined the EduIT waitlist!</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p><strong>Name:</strong> ${firstName} ${lastName}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>School:</strong> ${schoolName}</p>
              <p><strong>Population:</strong> ${studentPopulation}</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #999;">EduIT Automation Engine</p>
            </div>
          `
        });
      }
    } catch (emailError) {
      console.error("Failed to send notification email:", emailError);
      // Don't fail the whole request if email fails
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Waitlist error:", error);
    return NextResponse.json({ 
      error: "Failed to join waitlist", 
      details: error.message 
    }, { status: 500 });
  } finally {
    if (waitlistPrisma) {
      await waitlistPrisma.$disconnect();
    }
  }
}
