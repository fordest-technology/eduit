import {
  Button,
  Heading,
  Hr,
  Section,
  Text,
  Link,
} from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";

interface WelcomeEmailProps {
  name: string;
  role: string;
  schoolName: string;
  schoolUrl: string;
  email: string;
  password?: string;
  isParent?: boolean;
  studentName?: string;
  primaryColor?: string;
}

export const WelcomeEmail = ({
  name,
  role,
  schoolName,
  schoolUrl,
  email,
  password,
  isParent = false,
  studentName,
  primaryColor = "#f97316",
}: WelcomeEmailProps) => {
  const previewText = isParent 
    ? `Welcome to ${schoolName} - Your Parent Account`
    : `Welcome to ${schoolName} - Your ${role} Account`;

  return (
    <EmailLayout previewText={previewText} schoolName={schoolName}>
      <Heading style={h1}>Welcome to the Portal</Heading>
      
      <Text style={text}>
        Hello {name},
      </Text>
      
      <Text style={text}>
        {isParent 
          ? `An account has been created for you to monitor ${studentName}'s academic progress at ${schoolName}.`
          : `You have been officially registered as a ${role} at ${schoolName}.`}
      </Text>

      <Section style={card}>
        <Text style={label}>ACCESS CREDENTIALS</Text>
        
        <Section style={credItem}>
          <Text style={credLabel}>Portal URL</Text>
          <Link href={schoolUrl} style={{ ...link, color: primaryColor }}>{schoolUrl}</Link>
        </Section>
        
        <Hr style={divider} />
        
        <Section style={credItem}>
          <Text style={credLabel}>Work Email</Text>
          <Text style={credValue}>{email}</Text>
        </Section>
        
        {password && (
          <>
            <Hr style={divider} />
            <Section style={credItem}>
              <Text style={credLabel}>Temporary Password</Text>
              <Text style={{ ...credValue, fontFamily: "monospace", color: "#1e293b" }}>{password}</Text>
            </Section>
          </>
        )}
      </Section>

      <Section style={alert}>
        <Text style={alertText}>
          <strong>Security Note:</strong> Please change your password immediately after your first login to secure your account.
        </Text>
      </Section>

      <Section style={ctaSection}>
        <Button style={{ ...button, backgroundColor: primaryColor }} href={schoolUrl}>
          Launch Portal
        </Button>
      </Section>

      <Text style={footerText}>
        If you have any questions, please reach out to the {schoolName} administration office.
      </Text>
    </EmailLayout>
  );
};

export default WelcomeEmail;

const h1 = {
  color: "#0f172a",
  fontSize: "28px",
  fontWeight: "900",
  textAlign: "center" as const,
  margin: "0 0 24px 0",
  letterSpacing: "-0.05em",
};

const text = {
  color: "#475569",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 16px 0",
};

const card = {
  backgroundColor: "#f8fafc",
  borderRadius: "24px",
  padding: "32px",
  border: "1px solid #f1f5f9",
  margin: "32px 0",
};

const label = {
  color: "#94a3b8",
  fontSize: "11px",
  fontWeight: "800",
  letterSpacing: "0.1em",
  margin: "0 0 20px 0",
};

const credItem = {
  margin: "0",
};

const credLabel = {
  color: "#64748b",
  fontSize: "12px",
  fontWeight: "600",
  margin: "0 0 4px 0",
};

const credValue = {
  color: "#0f172a",
  fontSize: "15px",
  fontWeight: "700",
  margin: "0",
};

const link = {
  fontSize: "15px",
  fontWeight: "700",
  textDecoration: "none",
};

const divider = {
  margin: "16px 0",
  borderColor: "#e2e8f0",
};

const alert = {
  backgroundColor: "#fffbeb",
  borderLeft: "4px solid #f59e0b",
  padding: "16px 20px",
  borderRadius: "8px",
  margin: "24px 0",
};

const alertText = {
  color: "#92400e",
  fontSize: "14px",
  margin: "0",
};

const ctaSection = {
  textAlign: "center" as const,
  margin: "40px 0",
};

const button = {
  borderRadius: "16px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "800",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "20px 48px",
  boxShadow: "0 10px 25px rgba(249, 115, 22, 0.2)",
};

const footerText = {
  color: "#94a3b8",
  fontSize: "14px",
  textAlign: "center" as const,
  margin: "0",
};
