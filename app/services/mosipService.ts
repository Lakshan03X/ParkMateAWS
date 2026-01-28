import axios from "axios";
import Constants from "expo-constants";

const {
  MOSIP_BASE_URL,
  MOSIP_CLIENT_ID,
  MOSIP_CLIENT_SECRET,
  MOSIP_AUTH_ENDPOINT,
  MOSIP_ESIGNET_ENDPOINT,
} = Constants.expoConfig.extra;

export interface MosipUserData {
  fullName: string;
  address: string;
  dateOfBirth?: string;
  gender?: string;
  email?: string;
  phone?: string;
}

export interface MosipAuthResponse {
  status: string;
  message: string;
  data?: MosipUserData;
  token?: string;
}

class MosipService {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = MOSIP_BASE_URL;
    this.clientId = MOSIP_CLIENT_ID;
    this.clientSecret = MOSIP_CLIENT_SECRET;
  }

  // Get authentication token from MOSIP
  private async getAuthToken(): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}${MOSIP_AUTH_ENDPOINT}`,
        {
          clientId: this.clientId,
          clientSecret: this.clientSecret,
          grantType: "client_credentials",
        }
      );

      this.authToken = response.data.token;
      return this.authToken!;
    } catch (error) {
      console.error("MOSIP Authentication Error:", error);
      throw new Error("Failed to authenticate with MOSIP");
    }
  }

  // Verify NIC and fetch user data from MOSIP
  async verifyNIC(nicNumber: string): Promise<MosipAuthResponse> {
    try {
      // Get auth token if not already available
      if (!this.authToken) {
        await this.getAuthToken();
      }

      // Make request to MOSIP eSignet API to verify NIC and get user data
      const response = await axios.post(
        `${this.baseUrl}${MOSIP_ESIGNET_ENDPOINT}/authorize`,
        {
          individualId: nicNumber,
          individualIdType: "NIC",
          transactionId: this.generateTransactionId(),
        },
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Parse response and extract user data
      if (response.data && response.data.status === "success") {
        const userData: MosipUserData = {
          fullName: response.data.response?.name || "",
          address: response.data.response?.address || "",
          dateOfBirth: response.data.response?.dateOfBirth || "",
          gender: response.data.response?.gender || "",
          email: response.data.response?.email || "",
          phone: response.data.response?.phone || "",
        };

        return {
          status: "success",
          message: "NIC verified successfully",
          data: userData,
          token: response.data.token,
        };
      } else {
        return {
          status: "error",
          message: "Invalid NIC or verification failed",
        };
      }
    } catch (error: any) {
      console.error("NIC Verification Error:", error);

      // Handle specific error cases
      if (error.response?.status === 404) {
        return {
          status: "error",
          message: "NIC not found in MOSIP database",
        };
      } else if (error.response?.status === 401) {
        // Try to re-authenticate and retry once
        this.authToken = null;
        return this.verifyNIC(nicNumber);
      }

      return {
        status: "error",
        message: error.message || "Failed to verify NIC",
      };
    }
  }

  // Request OTP for authentication
  async requestOTP(
    nicNumber: string,
    mobileNumber: string
  ): Promise<{ status: string; message: string; transactionId?: string }> {
    try {
      if (!this.authToken) {
        await this.getAuthToken();
      }

      const response = await axios.post(
        `${this.baseUrl}${MOSIP_ESIGNET_ENDPOINT}/authenticate`,
        {
          individualId: nicNumber,
          otpChannel: ["PHONE"],
          phone: mobileNumber,
          transactionId: this.generateTransactionId(),
        },
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status === "success") {
        return {
          status: "success",
          message: "OTP sent successfully",
          transactionId: response.data.transactionId,
        };
      } else {
        return {
          status: "error",
          message: "Failed to send OTP",
        };
      }
    } catch (error: any) {
      console.error("OTP Request Error:", error);
      return {
        status: "error",
        message: error.message || "Failed to send OTP",
      };
    }
  }

  // Verify OTP
  async verifyOTP(
    transactionId: string,
    otp: string
  ): Promise<{ status: string; message: string; verified?: boolean }> {
    try {
      if (!this.authToken) {
        await this.getAuthToken();
      }

      const response = await axios.post(
        `${this.baseUrl}${MOSIP_ESIGNET_ENDPOINT}/verify`,
        {
          transactionId,
          otp,
        },
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status === "success") {
        return {
          status: "success",
          message: "OTP verified successfully",
          verified: true,
        };
      } else {
        return {
          status: "error",
          message: "Invalid OTP",
          verified: false,
        };
      }
    } catch (error: any) {
      console.error("OTP Verification Error:", error);
      return {
        status: "error",
        message: error.message || "Failed to verify OTP",
        verified: false,
      };
    }
  }

  // Generate unique transaction ID
  private generateTransactionId(): string {
    return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default new MosipService();
