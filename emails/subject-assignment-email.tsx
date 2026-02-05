import {
  Button,
  Heading,
  Section,
  Text,
  render,
} from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";

interface SubjectAssignmentEmailProps {
  teacherName: string;
  subjectName: string;
  subjectCode?: string | null;
  schoolName: string;
  schoolUrl: string;
}

export const SubjectAssignmentEmail = ({
  teacherName,
  subjectName,
  subjectCode,
  schoolName,
  schoolUrl,
}: SubjectAssignmentEmailProps) => {
  return (
    <EmailLayout previewText={`New Subject Assigned: ${subjectName}`} schoolName={schoolName}>
      <Heading style={h1}>Curriculum Assignment 📚</Heading>
      
      <Text style={text}>
        Hello {teacherName},
      </Text>
      
      <Text style={text}>
        You have been officially designated as the lead educator for a new subject at {schoolName}. Your curriculum architecture has been updated accordingly.
      </Text>

      <Section style={assignmentCard}>
        <Section style={item}>
          <Text style={itemLabel}>SUBJECT NAME</Text>
          <Text style={itemValue}>{subjectName}</Text>
        </Section>
        
        {subjectCode && (
          <Section style={item}>
            <Text style={itemLabel}>CURRICULUM CODE</Text>
            <Text style={itemValue}>{subjectCode}</Text>
          </Section>
        )}
        
        <Section style={item}>
          <Text style={itemLabel}>STATUS</Text>
          <Text style={{ ...itemValue, color: "#10b981" }}>ACTIVE ASSIGNMENT</Text>
        </Section>
      </Section>

      <Text style={text}>
        You can now access the course management materials, attendance registers, and assessment tools for this subject via your dashboard.
      </Text>

      <Section style={ctaSection}>
        <Button style={button} href={schoolUrl}>
          Access Course Dashboard
        </Button>
      </Section>

      <Text style={footerNote}>
        If you have questions regarding this assignment, please sync with your Department Head or Academic Dean.
      </Text>
    </EmailLayout>
  );
};

export default SubjectAssignmentEmail;

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

const assignmentCard = {
  backgroundColor: "#f0fdf4",
  borderRadius: "24px",
  padding: "32px",
  border: "1px solid #dcfce7",
  margin: "32px 0",
};

const item = {
  marginBottom: "16px",
};

const itemLabel = {
  color: "#166534",
  fontSize: "10px",
  fontWeight: "900",
  letterSpacing: "0.15em",
  margin: "0 0 4px 0",
};

const itemValue = {
  color: "#14532d",
  fontSize: "16px",
  fontWeight: "800",
  margin: "0",
};

const ctaSection = {
  textAlign: "center" as const,
  margin: "40px 0",
};

const button = {
  backgroundColor: "#10b981",
  borderRadius: "16px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "800",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "20px 48px",
  boxShadow: "0 10px 25px rgba(16, 185, 129, 0.2)",
};

const footerNote = {
  color: "#94a3b8",
  fontSize: "13px",
  textAlign: "center" as const,
  margin: "0",
  lineHeight: "20px",
};
