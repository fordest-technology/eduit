import axios from "axios";
import crypto from "crypto";

const PAYVESSEL_API_KEY = process.env.PAYVESSEL_API_KEY;
const PAYVESSEL_API_SECRET = process.env.PAYVESSEL_API_SECRET;
const PAYVESSEL_BUSINESS_ID = process.env.PAYVESSEL_BUSINESS_ID;
const PAYVESSEL_BASE_URL = "https://api.payvessel.com/pms/api/external/request";

if ((!PAYVESSEL_API_KEY || !PAYVESSEL_API_SECRET) && process.env.NODE_ENV === "production") {
  throw new Error("PAYVESSEL_API_KEY and PAYVESSEL_API_SECRET are required in production");
}

const payvesselApi = axios.create({
  baseURL: PAYVESSEL_BASE_URL,
  headers: {
    "api-key": PAYVESSEL_API_KEY,
    "api-secret": `Bearer ${PAYVESSEL_API_SECRET}`,
    "Content-Type": "application/json",
  },
});

export interface PayvesselVirtualAccountRequest {
  email: string;
  name: string;
  phoneNumber: string;
  bankcode: string[];
  account_type: "STATIC" | "DYNAMIC";
  businessid?: string;
  bvn?: string;
  nin?: string;
}

export interface PayvesselResponse<T> {
    status: boolean;
    service: string;
    business: string;
    data?: T; // Some responses have data, some have arrays directly? Let's check docs again.
    banks?: any[];
    message?: string;
}

export const payvesselClient = {
  /**
   * Create a virtual account (Static or Dynamic)
   */
  async createVirtualAccount(data: PayvesselVirtualAccountRequest) {
    try {
      const payload = {
        ...data,
        businessid: data.businessid || PAYVESSEL_BUSINESS_ID,
      };
      const response = await payvesselApi.post("/customerReservedAccount/", payload);
      return response.data;
    } catch (error: any) {
      console.error("Payvessel Create Virtual Account Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get details of a single virtual account
   */
  async getVirtualAccount(trackingReference: string) {
    try {
      const response = await payvesselApi.get(`/customerReservedAccount/${trackingReference}`);
      return response.data;
    } catch (error: any) {
      console.error("Payvessel Get Virtual Account Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Verify Payvessel Webhook Signature
   */
  verifySignature(payload: string, signature: string) {
    if (!PAYVESSEL_API_SECRET) return false;
    
    const hash = crypto
      .createHmac("sha512", PAYVESSEL_API_SECRET)
      .update(payload)
      .digest("hex");
    
    return hash === signature;
  },

  /**
   * IP Whitelist for Payvessel
   */
  isTrustedIp(ip: string) {
    const trustedIps = ["3.255.23.38", "162.246.254.36"];
    return trustedIps.includes(ip);
  }
};
