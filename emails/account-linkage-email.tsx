import {
  Button,
  Heading,
  Section,
  Text,
  render,
  Hr,
} from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";

interface AccountLinkageEmailProps {
  parentName: string;
  studentName: string;
  schoolName: string;
  schoolUrl: string;
  relation: string;
}

export const AccountLinkageEmail = ({
  parentName,
  studentName,
  schoolName,
  schoolUrl,
  relation,
}: AccountLinkageEmailProps) => {
  return (
    <EmailLayout previewText={`Student Linked: ${studentName}`} schoolName={schoolName}>
      <Heading style={h1}>Account Successfully Linked 🔗</Heading>
      
      <Text style={text}>
        Hello {parentName},
      </Text>
      
      <Text style={text}>
        Great news! Your parent account has been successfully linked to <strong>{studentName}</strong> at {schoolName}.
      </Text>

      <Section style={linkCard}>
        <Section style={item}>
          <Text style={itemLabel}>Student Identity</Text>
          <Text style={itemValue}>{studentName}</Text>
        </Section>
        <Hr style={divider} />
        <Section style={item}>
          <Text style={itemLabel}>Designated Relationship</Text>
          <Text style={itemValue}>{relation}</Text>
        </Section>
      </Section>

      <Text style={text}>
        You now have full administrative oversight of your child's academic journey, including:
      </Text>

      <Section style={listSection}>
        <ul style={list}>
          <li style={listItem}>Real-time performance tracking</li>
          <li style={listItem}>Secure school fee processing</li>
          <li style={listItem}>Attendance and activity monitoring</li>
          <li style={listItem}>Instant report card downloads</li>
        </ul>
      </Section>

      <Section style={ctaSection}>
        <Button style={button} href={schoolUrl}>
          Access Parent Portal
        </Button>
      </Section>

      <Text style={footerNote}>
        Thank you for being an active part of your child's educational excellence.
      </Text>
    </EmailLayout>
  );
};

export default AccountLinkageEmail;

const h1 = {
  color: "#0f172a",
  fontSize: "24px",
  fontWeight: "900",
  textAlign: "center" as const,
  margin: "0 0 24px 0",
};

const text = {
  color: "#475569",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 16px 0",
};

const linkCard = {
  background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
  borderRadius: "24px",
  padding: "32px",
  border: "1px solid #bae6fd",
  margin: "32px 0",
};

const item = {
  margin: "0",
};

const itemLabel = {
  color: "#0369a1",
  fontSize: "11px",
  fontWeight: "800",
  letterSpacing: "0.1em",
  margin: "0 0 4px 0",
};

const itemValue = {
  color: "#0c4a6e",
  fontSize: "16px",
  fontWeight: "800",
  margin: "0",
};

const divider = {
  margin: "16px 0",
  borderColor: "#bae6fd",
};

const listSection = {
  backgroundColor: "#f8fafc",
  padding: "24px 32px",
  borderRadius: "16px",
  margin: "24px 0",
};

const list = {
  padding: "0 0 0 20px",
  margin: "0",
};

const listItem = {
  color: "#475569",
  fontSize: "14px",
  marginBottom: "8px",
};

const ctaSection = {
  textAlign: "center" as const,
  margin: "40px 0",
};

const button = {
  backgroundColor: "#6366f1",
  borderRadius: "16px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "800",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "20px 48px",
  boxShadow: "0 10px 25px rgba(99, 102, 241, 0.2)",
};

const footerNote = {
  color: "#94a3b8",
  fontSize: "14px",
  textAlign: "center" as const,
  margin: "0",
  fontStyle: "italic",
};
