import awsDynamoService from "./awsDynamoService";

export interface DemoUserData {
  nicNumber: string;
  fullName: string;
  address: string;
  dateOfBirth?: string;
  gender?: string;
}

class AWSDemoService {
  private demoUsersTable = "demoUsers";

  // Local demo data as fallback (works offline)
  private localDemoUsers: DemoUserData[] = [
    {
      nicNumber: "200123456789",
      fullName: "Kamal Perera",
      address: "No. 45, Galle Road, Colombo 03, Sri Lanka",
      dateOfBirth: "2000-05-15",
      gender: "Male",
    },
    {
      nicNumber: "199587654321",
      fullName: "Nimal Silva",
      address: "No. 78, Kandy Road, Kandy, Sri Lanka",
      dateOfBirth: "1995-08-20",
      gender: "Male",
    },
    {
      nicNumber: "199912345678",
      fullName: "Kumari Fernando",
      address: "No. 123, Main Street, Negombo, Sri Lanka",
      dateOfBirth: "1999-03-10",
      gender: "Female",
    },
    {
      nicNumber: "200876543210",
      fullName: "Saman Jayawardena",
      address: "No. 56, Hospital Road, Galle, Sri Lanka",
      dateOfBirth: "1988-12-25",
      gender: "Male",
    },
    {
      nicNumber: "200298765432",
      fullName: "Dilini Rajapaksa",
      address: "No. 89, Station Road, Jaffna, Sri Lanka",
      dateOfBirth: "2002-07-08",
      gender: "Female",
    },
    {
      nicNumber: "200212121212",
      fullName: "Jayasantha Perera",
      address: "No. 99, Sakura Road, Colombo 03, Sri Lanka",
      dateOfBirth: "2000-05-08",
      gender: "Male",
    },
  ];

  // Initialize demo data in DynamoDB (run once)
  async initializeDemoData(): Promise<void> {
    try {
      const demoUsers: DemoUserData[] = this.localDemoUsers;

      for (const user of demoUsers) {
        await awsDynamoService.putItem(this.demoUsersTable, user);
      }

      console.log("✅ Demo data initialized successfully in DynamoDB");
    } catch (error) {
      console.error("❌ Error initializing demo data:", error);
      throw error;
    }
  }

  // Verify NIC from DynamoDB first, then fall back to local data
  async verifyNIC(nicNumber: string): Promise<{
    status: string;
    message: string;
    data?: DemoUserData;
  }> {
    try {
      console.log("🔍 Checking DynamoDB for NIC:", nicNumber);

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Try DynamoDB first (for real-time data)
      try {
        const result = await awsDynamoService.getItem(this.demoUsersTable, {
          nicNumber,
        });

        if (result.item) {
          const userData = result.item as DemoUserData;
          console.log("✅ NIC found in DynamoDB:", userData.fullName);
          return {
            status: "success",
            message: `NIC verified successfully for ${userData.fullName}`,
            data: userData,
          };
        } else {
          console.log(
            "⚠️ NIC not found in DynamoDB, checking local fallback..."
          );
        }
      } catch (dynamoError) {
        console.log("⚠️ DynamoDB unavailable, checking local fallback...");
      }

      // Fall back to local data if DynamoDB is offline or NIC not found
      const localUser = this.localDemoUsers.find(
        (user) => user.nicNumber === nicNumber
      );

      if (localUser) {
        console.log("✅ NIC found in local data:", localUser.fullName);
        return {
          status: "success",
          message: `NIC verified successfully for ${localUser.fullName} (offline mode)`,
          data: localUser,
        };
      }

      // Not found in either DynamoDB or local data
      console.log("❌ NIC not found");
      return {
        status: "error",
        message:
          "NIC not found. Please add this NIC to DynamoDB or use a demo NIC.",
      };
    } catch (error: any) {
      console.error("❌ NIC Verification Error:", error);
      return {
        status: "error",
        message: error.message || "Failed to verify NIC",
      };
    }
  }

  // OTP System (Demo - stores OTPs in memory)
  private otpStore: Map<
    string,
    { otp: string; nicNumber: string; mobileNumber: string; expiresAt: Date }
  > = new Map();

  // Generate and send OTP (demo version)
  async requestOTP(
    nicNumber: string,
    mobileNumber: string
  ): Promise<{ status: string; message: string; transactionId?: string }> {
    try {
      console.log("📱 Sending OTP to:", mobileNumber);

      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Create a transaction ID
      const transactionId = `TXN_${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}`;

      // Store OTP with 5-minute expiry
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);

      this.otpStore.set(transactionId, {
        otp,
        nicNumber,
        mobileNumber,
        expiresAt,
      });

      // In production, integrate with AWS SNS to send actual SMS
      console.log(`✅ OTP Generated: ${otp} (Valid for 5 minutes)`);
      console.log(`📲 Sending to: ${mobileNumber}`);

      return {
        status: "success",
        message: `OTP sent to ${mobileNumber}. Demo OTP: ${otp}`,
        transactionId,
      };
    } catch (error: any) {
      console.error("❌ OTP Request Error:", error);
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
  ): Promise<{
    status: string;
    message: string;
    verified: boolean;
    userData?: any;
  }> {
    try {
      console.log("🔍 Verifying OTP for transaction:", transactionId);

      const otpData = this.otpStore.get(transactionId);

      if (!otpData) {
        return {
          status: "error",
          message: "Invalid transaction ID or OTP expired",
          verified: false,
        };
      }

      // Check if OTP is expired
      if (new Date() > otpData.expiresAt) {
        this.otpStore.delete(transactionId);
        return {
          status: "error",
          message: "OTP has expired. Please request a new OTP.",
          verified: false,
        };
      }

      // Verify OTP
      if (otpData.otp !== otp) {
        return {
          status: "error",
          message: "Invalid OTP. Please try again.",
          verified: false,
        };
      }

      // OTP verified successfully
      console.log("✅ OTP Verified Successfully");
      this.otpStore.delete(transactionId); // Clean up

      return {
        status: "success",
        message: "OTP verified successfully",
        verified: true,
        userData: {
          nicNumber: otpData.nicNumber,
          mobileNumber: otpData.mobileNumber,
        },
      };
    } catch (error: any) {
      console.error("❌ OTP Verification Error:", error);
      return {
        status: "error",
        message: error.message || "Failed to verify OTP",
        verified: false,
      };
    }
  }

  // Resend OTP
  async resendOTP(
    transactionId: string
  ): Promise<{ status: string; message: string; transactionId?: string }> {
    try {
      const otpData = this.otpStore.get(transactionId);

      if (!otpData) {
        return {
          status: "error",
          message: "Invalid transaction ID. Please restart the registration.",
        };
      }

      // Generate new OTP and transaction ID
      return await this.requestOTP(otpData.nicNumber, otpData.mobileNumber);
    } catch (error: any) {
      console.error("❌ OTP Resend Error:", error);
      return {
        status: "error",
        message: error.message || "Failed to resend OTP",
      };
    }
  }
}

export default new AWSDemoService();
