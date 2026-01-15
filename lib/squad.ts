import axios from "axios";

const SQUAD_SECRET_KEY = process.env.SQUAD_SECRET_KEY;
const SQUAD_BASE_URL = process.env.SQUAD_BASE_URL || "https://sandbox-api-d.squadco.com";
const SQUAD_BENEFICIARY_ACCOUNT = process.env.SQUAD_BENEFICIARY_ACCOUNT || (SQUAD_BASE_URL.includes("sandbox") ? "0123456789" : undefined);

if (!SQUAD_SECRET_KEY && process.env.NODE_ENV === "production") {
  throw new Error("SQUAD_SECRET_KEY is required in production");
}

const squadApi = axios.create({
  baseURL: SQUAD_BASE_URL,
  headers: {
    Authorization: `Bearer ${SQUAD_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

export interface SquadPaymentRequest {
  amount: number;
  currency: string;
  email: string;
  customer_name?: string;
  initiate_type: "inline" | "link";
  callback_url?: string;
  metadata?: Record<string, any>;
}

export interface SquadVirtualAccountRequest {
  first_name: string;
  last_name: string;
  middle_name?: string;
  mobile_num: string;
  dob: string;
  email: string;
  bvn: string;
  gender: string;
  address: string;
  customer_identifier: string;
}

export interface SquadPayoutRequest {
  amount: number;
  currency: string;
  remark: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  transaction_reference: string;
}

export const squadClient = {
  /**
   * Initiate a payment link or inline payment
   */
  async initiatePayment(data: SquadPaymentRequest) {
    try {
      const response = await squadApi.post("/transaction/initiate", data);
      return response.data;
    } catch (error: any) {
      console.error("Squad Initiate Payment Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Verify a transaction
   */
  async verifyTransaction(transactionRef: string) {
    try {
      const response = await squadApi.get(`/transaction/verify/${transactionRef}`);
      return response.data;
    } catch (error: any) {
      console.error("Squad Verify Transaction Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Create a fixed virtual account for a business
   */
  async createBusinessVirtualAccount(data: {
    bvn: string;
    business_name: string;
    customer_identifier: string;
    mobile_num: string;
    beneficiary_account?: string;
  }) {
    try {
      const payload = {
          ...data,
          beneficiary_account: data.beneficiary_account || SQUAD_BENEFICIARY_ACCOUNT
      };
      const response = await squadApi.post("/virtual-account/business", payload);
      return response.data;
    } catch (error: any) {
      console.error("Squad Create Business Virtual Account Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Create a dynamic virtual account for an individual
   */
  async createVirtualAccount(data: SquadVirtualAccountRequest & { beneficiary_account?: string }) {
    try {
      const payload = {
          ...data,
          beneficiary_account: data.beneficiary_account || SQUAD_BENEFICIARY_ACCOUNT
      };
      const response = await squadApi.post("/virtual-account", payload);
      return response.data;
    } catch (error: any) {
      console.error("Squad Create Virtual Account Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Process a payout/withdrawal
   */
  async initiatePayout(data: SquadPayoutRequest) {
    try {
      const response = await squadApi.post("/payout/transfer", data);
      return response.data;
    } catch (error: any) {
      console.error("Squad Initiate Payout Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get list of banks and their codes
   */
  async getBanks() {
    try {
      const response = await squadApi.get("/banks");
      return response.data;
    } catch (error: any) {
      console.error("Squad Get Banks Error:", error.response?.data || error.message);
      throw error;
    }
  }
};
