import {
  Heading,
  Section,
  Text,
  render,
} from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";

interface PasswordResetEmailProps {
  userName: string;
  resetCode: string;
  schoolName: string;
}

export const PasswordResetEmail = ({
  userName,
  resetCode,
  schoolName,
}: PasswordResetEmailProps) => {
  return (
    <EmailLayout previewText={`Your verification code: ${resetCode}`} schoolName={schoolName}>
      <Section style={heroSection}>
        <Heading style={h1}>Security Verification</Heading>
      </Section>
      
      <Text style={text}>
        Hello {userName},
      </Text>
      
      <Text style={text}>
        A password reset request was received for your {schoolName} account. Please use the following 4-digit verification code to proceed.
      </Text>

      <Section style={codeCard}>
        <Text style={codeLabel}>VERIFICATION CODE</Text>
        <Section style={codeContainer}>
          {resetCode.split("").map((digit, idx) => (
            <div key={idx} style={codeDigit}>{digit}</div>
          ))}
        </Section>
      </Section>

      <Text style={expiryText}>
        This code will expire in 10 minutes for your protection.
      </Text>

      <Section style={alert}>
        <Text style={alertText}>
          <strong>Security Warning:</strong> If you did not request this reset, please ignore this email or contact your school administrator immediately.
        </Text>
      </Section>
    </EmailLayout>
  );
};

export default PasswordResetEmail;

const heroSection = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const h1 = {
  color: "#0f172a",
  fontSize: "24px",
  fontWeight: "900",
  margin: "0",
  letterSpacing: "-0.02em",
};

const text = {
  color: "#475569",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 16px 0",
};

const codeCard = {
  backgroundColor: "#fdf8f6",
  borderRadius: "32px",
  padding: "48px 32px",
  border: "2px dashed #f97316",
  margin: "32px 0",
  textAlign: "center" as const,
};

const codeLabel = {
  color: "#ea580c",
  fontSize: "11px",
  fontWeight: "900",
  letterSpacing: "0.2em",
  margin: "0 0 24px 0",
};

const codeContainer = {
  display: "inline-flex" as const,
  gap: "12px",
  justifyContent: "center" as const,
};

const codeDigit = {
  width: "60px",
  height: "72px",
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  border: "1px solid #feece4",
  display: "inline-block",
  fontSize: "36px",
  fontWeight: "900",
  color: "#0f172a",
  lineHeight: "72px",
  textAlign: "center" as const,
  margin: "0 6px",
  boxShadow: "0 4px 12px rgba(234, 88, 12, 0.05)",
};

const expiryText = {
  color: "#94a3b8",
  fontSize: "14px",
  textAlign: "center" as const,
  margin: "0 0 32px 0",
  fontStyle: "italic",
};

const alert = {
  backgroundColor: "#f1f5f9",
  padding: "20px",
  borderRadius: "16px",
  margin: "24px 0",
};

const alertText = {
  color: "#475569",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0",
};
