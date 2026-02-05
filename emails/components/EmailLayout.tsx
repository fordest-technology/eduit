import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface EmailLayoutProps {
  previewText: string;
  children: React.ReactNode;
  schoolLogo?: string;
  schoolName?: string;
}

export const EmailLayout = ({
  previewText,
  children,
  schoolLogo,
  schoolName = "EduIT Global",
}: EmailLayoutProps) => {
  const logoUrl = schoolLogo || "https://raw.githubusercontent.com/fordest-technology/eduit/main/public/eduitlogo-text.png";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src={logoUrl}
              width="140"
              height="36"
              alt={schoolName}
              style={logo}
            />
          </Section>
          
          <Section style={content}>
            {children}
          </Section>
          
          <Section style={footer}>
            <Hr style={footerDivider} />
            <Text style={footerText}>
              © {new Date().getFullYear()} {schoolName}. All rights reserved.
            </Text>
            <Text style={footerSubtext}>
              Innovative Infrastructure for Modern Education.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#f8fafc",
  fontFamily: 'Sora, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: "40px auto",
  width: "600px",
  backgroundColor: "#ffffff",
  borderRadius: "32px",
  overflow: "hidden",
  boxShadow: "0 10px 40px rgba(0,0,0,0.05)",
};

const header = {
  padding: "40px 0",
  textAlign: "center" as const,
};

const logo = {
  margin: "0 auto",
};

const content = {
  padding: "0 48px 48px 48px",
};

const footer = {
  padding: "0 48px 48px 48px",
  textAlign: "center" as const,
};

const footerDivider = {
  borderColor: "#f1f5f9",
  margin: "0 0 24px 0",
};

const footerText = {
  color: "#1e293b",
  fontSize: "12px",
  fontWeight: "700",
  margin: "0",
};

const footerSubtext = {
  color: "#94a3b8",
  fontSize: "11px",
  fontWeight: "500",
  margin: "4px 0 0 0",
};
