import {
  Button,
  Heading,
  Section,
  Text,
  render,
} from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";

interface ResultPublishedEmailProps {
  studentName: string;
  recipientName: string;
  periodName: string;
  sessionName: string;
  schoolName: string;
  appUrl: string;
}

export const ResultPublishedEmail = ({
  studentName,
  recipientName,
  periodName,
  sessionName,
  schoolName,
  appUrl,
}: ResultPublishedEmailProps) => {
  return (
    <EmailLayout previewText={`Academic Results Published - ${periodName}`} schoolName={schoolName}>
      <Heading style={h1}>Results Published 🎓</Heading>
      
      <Text style={text}>
        Hello {recipientName},
      </Text>
      
      <Text style={text}>
        The academic performance report for <strong>{studentName}</strong> covering <strong>{periodName}</strong> of the <strong>{sessionName}</strong> session has been officially published and is now available for review.
      </Text>

      <Section style={infoCard}>
        <Section style={item}>
          <Text style={itemLabel}>Report Period</Text>
          <Text style={itemValue}>{periodName} - {sessionName}</Text>
        </Section>
        <Section style={item}>
          <Text style={itemLabel}>Institutional Status</Text>
          <Text style={{ ...itemValue, color: "#10b981" }}>Verified & Released</Text>
        </Section>
      </Section>

      <Section style={ctaSection}>
        <Button style={button} href={`${appUrl}/dashboard/my-results`}>
          View Academic Report
        </Button>
      </Section>

      <Text style={instructionText}>
        You can download the comprehensive PDF report card directly from the "My Results" section of your portal.
      </Text>
    </EmailLayout>
  );
};

export default ResultPublishedEmail;

const h1 = {
  color: "#0f172a",
  fontSize: "26px",
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

const infoCard = {
  backgroundColor: "#f8fafc",
  borderRadius: "24px",
  padding: "32px",
  border: "1px solid #f1f5f9",
  margin: "32px 0",
};

const item = {
  marginBottom: "16px",
};

const itemLabel = {
  color: "#94a3b8",
  fontSize: "11px",
  fontWeight: "800",
  letterSpacing: "0.1em",
  margin: "0 0 4px 0",
};

const itemValue = {
  color: "#0f172a",
  fontSize: "15px",
  fontWeight: "700",
  margin: "0",
};

const ctaSection = {
  textAlign: "center" as const,
  margin: "40px 0",
};

const button = {
  backgroundColor: "#0f172a",
  borderRadius: "16px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "800",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "20px 48px",
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.2)",
};

const instructionText = {
  color: "#94a3b8",
  fontSize: "14px",
  textAlign: "center" as const,
  margin: "0",
  lineHeight: "22px",
};
