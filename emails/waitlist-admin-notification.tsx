import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  render,
} from "@react-email/components";
import * as React from "react";

interface WaitlistAdminEmailProps {
  firstName: string;
  lastName: string;
  email: string;
  schoolName: string;
  studentPopulation: string;
}

export const WaitlistAdminEmail = ({
  firstName,
  lastName,
  email,
  schoolName,
  studentPopulation,
}: WaitlistAdminEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>New Waitlist Entry: {schoolName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Img
              src="https://eduit-fordest.vercel.app/eduitlogo-text.png"
              width="140"
              height="40"
              alt="EduIT Ecosystem"
              style={logo}
            />
          </Section>
          
          <Section style={contentSection}>
            <Heading style={h1}>New Waitlist Entry</Heading>
            <Text style={text}>
              A new high-priority institution has just signed up for the EduIT waitlist.
            </Text>
            
            <Section style={infoCard}>
              <Text style={label}>FULL NAME</Text>
              <Text style={value}>{firstName} {lastName}</Text>
              
              <Hr style={divider} />
              
              <Text style={label}>SCHOOL NAME</Text>
              <Text style={value}>{schoolName}</Text>
              
              <Hr style={divider} />
              
              <Text style={label}>WORK EMAIL</Text>
              <Link href={`mailto:${email}`} style={link}>{email}</Link>
              
              <Hr style={divider} />
              
              <Text style={label}>STUDENT POPULATION</Text>
              <Text style={value}>{studentPopulation}</Text>
            </Section>
            
            <Text style={footerText}>
              You are receiving this because you are an authorized administrator for Fordest Technologies.
            </Text>
          </Section>
          
          <Section style={footer}>
            <Hr style={footerDivider} />
            <Text style={footerCopyright}>
              © {new Date().getFullYear()} Fordest Technologies. Level 2, Lagos, Nigeria.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WaitlistAdminEmail;

// --- Styles ---

const main = {
  backgroundColor: "#f8fafc",
  fontFamily: 'Sora, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: "40px auto",
  width: "560px",
  backgroundColor: "#ffffff",
  borderRadius: "24px",
  overflow: "hidden",
  boxShadow: "0 10px 40px rgba(0,0,0,0.05)",
};

const headerSection = {
  padding: "32px",
  textAlign: "center" as const,
  backgroundColor: "#ffffff",
};

const logo = {
  margin: "0 auto",
  display: "block",
};

const contentSection = {
  padding: "0 40px 40px 40px",
};

const h1 = {
  color: "#0f172a",
  fontSize: "24px",
  fontWeight: "800",
  textAlign: "center" as const,
  margin: "0 0 16px 0",
  letterSpacing: "-0.025em",
};

const text = {
  color: "#64748b",
  fontSize: "15px",
  lineHeight: "24px",
  textAlign: "center" as const,
  margin: "0 0 32px 0",
};

const infoCard = {
  backgroundColor: "#fdf8f6",
  borderRadius: "20px",
  padding: "24px",
  border: "1px solid #feece4",
};

const label = {
  color: "#ea580c",
  fontSize: "10px",
  fontWeight: "900",
  letterSpacing: "0.1em",
  margin: "0 0 4px 0",
  textTransform: "uppercase" as const,
};

const value = {
  color: "#1e293b",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0",
};

const link = {
  color: "#f97316",
  fontSize: "16px",
  fontWeight: "700",
  textDecoration: "none",
};

const divider = {
  margin: "16px 0",
  borderColor: "#feece4",
};

const footerText = {
  color: "#94a3b8",
  fontSize: "12px",
  textAlign: "center" as const,
  margin: "32px 0 0 0",
};

const footer = {
  padding: "0 40px 40px 40px",
};

const footerDivider = {
  borderColor: "#f1f5f9",
  margin: "0 0 24px 0",
};

const footerCopyright = {
  color: "#cbd5e1",
  fontSize: "11px",
  fontWeight: "600",
  textAlign: "center" as const,
  margin: "0",
};
