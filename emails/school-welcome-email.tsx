import {
  Button,
  Heading,
  Hr,
  Section,
  Text,
  Link,
  Img,
} from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";

interface SchoolWelcomeEmailProps {
  adminName: string;
  adminEmail: string;
  schoolName: string;
  schoolUrl: string;
  password?: string;
}

export const SchoolWelcomeEmail = ({
  adminName,
  adminEmail,
  schoolName,
  schoolUrl,
  password,
}: SchoolWelcomeEmailProps) => {
  return (
    <EmailLayout previewText={`Welcome to EduIT - ${schoolName} is live!`} schoolName={schoolName}>
      <Section style={heroSection}>
        <Heading style={h1}>Your Institution is Live 🚀</Heading>
        <Text style={heroText}>
          The digital transformation of {schoolName} begins today. Your administrative architecture has been successfully provisioned.
        </Text>
      </Section>

      <Text style={text}>
        Hello {adminName},
      </Text>
      
      <Text style={text}>
        Congratulations on choosing EduIT as your operating system. Below are your master administrative credentials to access the global dashboard.
      </Text>

      <Section style={card}>
        <Text style={label}>PORTAL CONFIGURATION</Text>
        
        <Section style={credItem}>
          <Text style={credLabel}>Management Endpoint</Text>
          <Link href={schoolUrl} style={link}>{schoolUrl}</Link>
        </Section>
        
        <Hr style={divider} />
        
        <Section style={credItem}>
          <Text style={credLabel}>Admin Identity</Text>
          <Text style={credValue}>{adminEmail}</Text>
        </Section>
        
        {password && (
          <>
            <Hr style={divider} />
            <Section style={credItem}>
              <Text style={credLabel}>Master Pass</Text>
              <Text style={{ ...credValue, fontFamily: "monospace" }}>{password}</Text>
            </Section>
          </>
        )}
      </Section>

      <Section style={stepsSection}>
        <Text style={label}>NEXT STRATEGIC STEPS</Text>
        
        <div style={step}>
          <div style={stepNum}>1</div>
          <Text style={stepText}><strong>Create Sessions:</strong> Define your first academic year and terms.</Text>
        </div>
        
        <div style={step}>
          <div style={stepNum}>2</div>
          <Text style={stepText}><strong>Build Levels:</strong> Set up your classes, from primary to advanced.</Text>
        </div>
        
        <div style={step}>
          <div style={stepNum}>3</div>
          <Text style={stepText}><strong>Onboard Users:</strong> Bulk import your teachers and students.</Text>
        </div>
      </Section>

      <Section style={ctaSection}>
        <Button style={button} href={schoolUrl}>
          Launch Management Portal
        </Button>
      </Section>

      <Text style={footerText}>
        Managed by <strong>EduIT OS</strong>. Need engineering support? <Link href="mailto:engineering@fordestech.com" style={{ color: "#f97316" }}>Contact our team</Link>.
      </Text>
    </EmailLayout>
  );
};

export default SchoolWelcomeEmail;

const heroSection = {
  textAlign: "center" as const,
  backgroundColor: "#0f172a",
  borderRadius: "24px",
  padding: "40px 32px",
  marginBottom: "32px",
};

const h1 = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "900",
  margin: "0 0 16px 0",
  letterSpacing: "-0.05em",
};

const heroText = {
  color: "#94a3b8",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0",
};

const text = {
  color: "#475569",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 16px 0",
};

const card = {
  backgroundColor: "#ffffff",
  borderRadius: "24px",
  padding: "32px",
  border: "1px solid #f1f5f9",
  margin: "32px 0",
  boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
};

const label = {
  color: "#f97316",
  fontSize: "11px",
  fontWeight: "900",
  letterSpacing: "0.2em",
  margin: "0 0 20px 0",
  textAlign: "center" as const,
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
  color: "#f97316",
  fontSize: "15px",
  fontWeight: "700",
  textDecoration: "none",
};

const divider = {
  margin: "16px 0",
  borderColor: "#f1f5f9",
};

const stepsSection = {
  backgroundColor: "#f8fafc",
  padding: "32px",
  borderRadius: "24px",
  margin: "32px 0",
};

const step = {
  display: "flex" as const,
  alignItems: "center" as const,
  marginBottom: "16px",
};

const stepNum = {
  backgroundColor: "#ffffff",
  color: "#0f172a",
  width: "28px",
  height: "28px",
  borderRadius: "8px",
  display: "flex" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  fontSize: "14px",
  fontWeight: "900",
  marginRight: "16px",
  border: "1px solid #e2e8f0",
};

const stepText = {
  color: "#475569",
  fontSize: "14px",
  margin: "0",
};

const ctaSection = {
  textAlign: "center" as const,
  margin: "40px 0",
};

const button = {
  backgroundColor: "#f97316",
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
  fontSize: "13px",
  textAlign: "center" as const,
  margin: "0",
};
