// Mock MOSIP Service for Development/Testing
// Use this when you don't have MOSIP credentials yet

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

class MockMosipService {
  // Mock database of NIC numbers
  private mockDatabase: { [key: string]: MosipUserData } = {
    "200012345678": {
      fullName: "Kamal Perera",
      address: "No. 45, Galle Road, Colombo 03, Sri Lanka",
      dateOfBirth: "2000-05-15",
      gender: "Male",
      email: "kamal.perera@email.com",
      phone: "0771234567",
    },
    "199587654321": {
      fullName: "Nimal Silva",
      address: "No. 78, Kandy Road, Kandy, Sri Lanka",
      dateOfBirth: "1995-08-20",
      gender: "Male",
      email: "nimal.silva@email.com",
      phone: "0777654321",
    },
    "199912345678": {
      fullName: "Kumari Fernando",
      address: "No. 123, Main Street, Negombo, Sri Lanka",
      dateOfBirth: "1999-03-10",
      gender: "Female",
      email: "kumari.fernando@email.com",
      phone: "0769876543",
    },
  };

  // Simulate API delay
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Verify NIC and fetch user data
  async verifyNIC(nicNumber: string): Promise<MosipAuthResponse> {
    console.log("🧪 Mock MOSIP: Verifying NIC:", nicNumber);
    await this.delay(1500); // Simulate network delay

    const userData = this.mockDatabase[nicNumber];

    if (userData) {
      console.log("✅ Mock MOSIP: NIC verified successfully");
      return {
        status: "success",
        message: "NIC verified successfully",
        data: userData,
        token: `mock-token-${Date.now()}`,
      };
    } else {
      console.log("❌ Mock MOSIP: NIC not found");
      return {
        status: "error",
        message: "NIC not found in MOSIP database",
      };
    }
  }

  // Request OTP for authentication
  async requestOTP(
    nicNumber: string,
    mobileNumber: string
  ): Promise<{ status: string; message: string; transactionId?: string }> {
    console.log("🧪 Mock MOSIP: Sending OTP to:", mobileNumber);
    await this.delay(1000);

    // Always succeed in mock
    const transactionId = `MOCK-TXN-${Date.now()}`;
    console.log('✅ Mock MOSIP: OTP sent successfully. Use "1234" to verify');

    return {
      status: "success",
      message: "OTP sent successfully (Use 1234 for testing)",
      transactionId,
    };
  }

  // Verify OTP
  async verifyOTP(
    transactionId: string,
    otp: string
  ): Promise<{ status: string; message: string; verified?: boolean }> {
    console.log("🧪 Mock MOSIP: Verifying OTP:", otp);
    await this.delay(1000);

    // Accept "1234" as valid OTP for testing
    if (otp === "1234") {
      console.log("✅ Mock MOSIP: OTP verified successfully");
      return {
        status: "success",
        message: "OTP verified successfully",
        verified: true,
      };
    } else {
      console.log("❌ Mock MOSIP: Invalid OTP");
      return {
        status: "error",
        message: "Invalid OTP. Use 1234 for testing",
        verified: false,
      };
    }
  }
}

export default new MockMosipService();
