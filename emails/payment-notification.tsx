import {
  Heading,
  Hr,
  Section,
  Text,
  render,
} from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./components/EmailLayout";

interface PaymentNotificationEmailProps {
  recipientName: string;
  studentName: string;
  amount: number;
  billName: string;
  transactionRef: string;
  date: Date;
  schoolName: string;
  isParent: boolean;
}

export const PaymentNotificationEmail = ({
  recipientName,
  studentName,
  amount,
  billName,
  transactionRef,
  date,
  schoolName,
  isParent,
}: PaymentNotificationEmailProps) => {
  const formattedAmount = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);

  const formattedDate = new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);

  const previewText = isParent
    ? `Payment Receipt: ${billName} for ${studentName}`
    : `New Payment Received: ${billName} from ${studentName}`;

  return (
    <EmailLayout previewText={previewText} schoolName={schoolName}>
      <Heading style={h1}>{isParent ? "Payment Receipt" : "Payment Received"}</Heading>
      
      <Text style={text}>
        Hello {recipientName},
      </Text>
      
      <Text style={text}>
        {isParent
          ? `This is an official confirmation for your payment regarding ${billName}. Thank you for your continued partnership.`
          : `A new financial transaction has been processed for ${billName}. Details are archived below.`}
      </Text>

      <Section style={receiptCard}>
        <Section style={receiptHeader}>
          <Text style={receiptLabel}>TOTAL AMOUNT PAID</Text>
          <Text style={amountText}>{formattedAmount}</Text>
        </Section>
        
        <Section style={receiptBody}>
          <Section style={receiptItem}>
            <Text style={itemLabel}>Student</Text>
            <Text style={itemValue}>{studentName}</Text>
          </Section>
          
          <Hr style={itemDivider} />
          
          <Section style={receiptItem}>
            <Text style={itemLabel}>Transaction Ref</Text>
            <Text style={{ ...itemValue, fontFamily: "monospace" }}>{transactionRef}</Text>
          </Section>
          
          <Hr style={itemDivider} />
          
          <Section style={receiptItem}>
            <Text style={itemLabel}>Date & Time</Text>
            <Text style={itemValue}>{formattedDate}</Text>
          </Section>
          
          <Hr style={itemDivider} />
          
          <Section style={receiptItem}>
            <Text style={itemLabel}>Status</Text>
            <Text style={{ ...itemValue, color: "#10b981" }}>SUCCESSFUL</Text>
          </Section>
        </Section>
      </Section>

      <Text style={footerNote}>
        A secure digital record of this transaction has been saved to your portal profile.
      </Text>
    </EmailLayout>
  );
};

export default PaymentNotificationEmail;

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

const receiptCard = {
  borderRadius: "24px",
  overflow: "hidden" as const,
  border: "1px solid #f1f5f9",
  margin: "32px 0",
  boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
};

const receiptHeader = {
  backgroundColor: "#f8fafc",
  padding: "32px",
  textAlign: "center" as const,
  borderBottom: "1px solid #f1f5f9",
};

const receiptLabel = {
  color: "#94a3b8",
  fontSize: "11px",
  fontWeight: "800",
  letterSpacing: "0.1em",
  margin: "0 0 8px 0",
};

const amountText = {
  color: "#0f172a",
  fontSize: "36px",
  fontWeight: "900",
  margin: "0",
  letterSpacing: "-0.02em",
};

const receiptBody = {
  padding: "32px",
};

const receiptItem = {
  display: "flex" as const,
  justifyContent: "space-between" as const,
  margin: "0",
};

const itemLabel = {
  color: "#64748b",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0",
};

const itemValue = {
  color: "#0f172a",
  fontSize: "14px",
  fontWeight: "700",
  margin: "0",
  textAlign: "right" as const,
};

const itemDivider = {
  margin: "16px 0",
  borderColor: "#f1f5f9",
  borderStyle: "dashed",
};

const footerNote = {
  color: "#94a3b8",
  fontSize: "13px",
  textAlign: "center" as const,
  margin: "0",
  fontStyle: "italic",
};
