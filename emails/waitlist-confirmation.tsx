import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  render,
  Button,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface WaitlistConfirmationEmailProps {
  firstName: string;
}

export const WaitlistConfirmationEmail = ({
  firstName,
}: WaitlistConfirmationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to the EduIT Waitlist, {firstName}!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Img
              src="https://raw.githubusercontent.com/fordest-technology/eduit/main/public/eduitlogo-text.png"
              width="130"
              height="36"
              alt="EduIT Ecosystem"
              style={logo}
            />
          </Section>
          
          <Section style={contentSection}>
            <Heading style={h1}>You're in the Loop!</Heading>
            <Text style={text}>
              Hello {firstName},
            </Text>
            <Text style={text}>
              Thanks for joining the EduIT waitlist. We're thrilled to have you with us as we build the future of education management.
            </Text>
            
            <Section style={card}>
              <Heading style={cardH2}>What's Next?</Heading>
              <Text style={cardText}>
                We are currently rolling out early access to a select group of institutions. Our team will review your application and reach out to schedule an onboarding strategy session if it's a perfect match.
              </Text>
            </Section>
            
            <Section style={ctaSection}>
              <Button style={button} href="https://eduit-fordest.vercel.app">
                Explore Our Ecosystem
              </Button>
            </Section>
            
            <Text style={text}>
              In the meantime, feel free to follow our journey as we redefine how schools operate.
            </Text>
            
            <Text style={signOff}>
              Warm regards,<br />
              <strong>The EduIT Founding Team</strong>
            </Text>
          </Section>
          
          <Section style={footer}>
            <Hr style={footerDivider} />
            <Text style={footerCopyright}>
              © {new Date().getFullYear()} Fordest Technologies. <br />
              Innovative Education Infrastructure.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WaitlistConfirmationEmail;

// --- Styles ---

const main = {
  backgroundColor: "#ffffff",
  fontFamily: 'Sora, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: "0 auto",
  width: "600px",
  padding: "40px 0",
};

const headerSection = {
  padding: "32px 0",
  textAlign: "center" as const,
};

const logo = {
  margin: "0 auto",
};

const contentSection = {
  backgroundColor: "#fcfcfc",
  padding: "40px",
  borderRadius: "32px",
  border: "1px solid #f1f5f9",
};

const h1 = {
  color: "#1e293b",
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
  margin: "0 0 20px 0",
};

const card = {
  backgroundColor: "#0f172a",
  padding: "32px",
  borderRadius: "24px",
  margin: "32px 0",
};

const cardH2 = {
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: "800",
  margin: "0 0 12px 0",
};

const cardText = {
  color: "#94a3b8",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0",
};

const ctaSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#ea580c",
  borderRadius: "16px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "800",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "20px 40px",
  boxShadow: "0 10px 25px rgba(234, 88, 12, 0.2)",
};

const signOff = {
  color: "#1e293b",
  fontSize: "16px",
  margin: "40px 0 0 0",
};

const footer = {
  padding: "32px 0",
  textAlign: "center" as const,
};

const footerDivider = {
  borderColor: "#f1f5f9",
  margin: "0 0 24px 0",
};

const footerCopyright = {
  color: "#94a3b8",
  fontSize: "12px",
  fontWeight: "600",
  lineHeight: "20px",
  margin: "0",
};
