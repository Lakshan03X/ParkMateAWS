import awsDynamoService from "./awsDynamoService";
// Switch between demo and real MOSIP
// For demo: use awsDemoService
// For production: use mosipService
import awsDemoService from "./awsDemoService";
// import mosipService from './mosipService'; // Uncomment when using real MOSIP

export interface UserRegistrationData {
  nicNumber: string;
  fullName: string;
  address: string;
  mobileNumber: string;
  email?: string;
  role: string;
  createdAt: Date;
  verified: boolean;
}

class ApiService {
  // Register user in AWS DynamoDB after MOSIP verification
  async registerUser(
    userData: UserRegistrationData,
  ): Promise<{ status: string; message: string; userId?: string }> {
    try {
      // Check if user already exists
      const existingUser = await awsDynamoService.getItem("parkmate-users", {
        nicNumber: userData.nicNumber,
      });

      if (existingUser.item) {
        return {
          status: "error",
          message: "User with this NIC already exists",
        };
      }

      // Generate a unique userId
      const userId = `USER_${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}`;

      // Add user to DynamoDB
      const result = await awsDynamoService.putItem("parkmate-users", {
        userId,
        ...userData,
        createdAt: new Date().toISOString(),
        verified: false,
      });

      if (!result.success) {
        return {
          status: "error",
          message: result.error || "Failed to register user",
        };
      }

      return {
        status: "success",
        message: "User registered successfully",
        userId,
      };
    } catch (error: any) {
      console.error("User Registration Error:", error);
      return {
        status: "error",
        message: error.message || "Failed to register user",
      };
    }
  }

  // Update user verification status
  async updateUserVerification(
    userId: string,
    verified: boolean,
  ): Promise<{ status: string; message: string }> {
    try {
      const result = await awsDynamoService.updateItem(
        "parkmate-users",
        { userId },
        { verified, verifiedAt: new Date().toISOString() },
      );

      if (!result.success) {
        return {
          status: "error",
          message: result.error || "Failed to update verification status",
        };
      }

      return {
        status: "success",
        message: "User verification status updated",
      };
    } catch (error: any) {
      console.error("Update Verification Error:", error);
      return {
        status: "error",
        message: error.message || "Failed to update verification status",
      };
    }
  }

  // Get user by NIC
  async getUserByNIC(
    nicNumber: string,
  ): Promise<{ status: string; user?: any; message?: string }> {
    try {
      const result = await awsDynamoService.getItem("parkmate-users", {
        nicNumber,
      });

      if (!result.item) {
        return {
          status: "error",
          message: "User not found",
        };
      }

      return {
        status: "success",
        user: result.item,
      };
    } catch (error: any) {
      console.error("Get User Error:", error);
      return {
        status: "error",
        message: error.message || "Failed to fetch user",
      };
    }
  }

  // Complete registration flow: Verify NIC -> Register -> Send OTP
  async initiateRegistration(
    nicNumber: string,
    mobileNumber: string,
    email?: string,
  ): Promise<{
    status: string;
    message: string;
    userData?: any;
    transactionId?: string;
  }> {
    try {
      // Step 1: Verify NIC with AWS Demo Service (or MOSIP in production)
      const nicVerification = await awsDemoService.verifyNIC(nicNumber);
      // For production, replace with: const nicVerification = await mosipService.verifyNIC(nicNumber);

      if (nicVerification.status !== "success" || !nicVerification.data) {
        return {
          status: "error",
          message: nicVerification.message,
        };
      }

      // Step 2: Send OTP for verification
      const otpResponse = await awsDemoService.requestOTP(
        nicNumber,
        mobileNumber,
      );
      // For production, replace with: const otpResponse = await mosipService.requestOTP(nicNumber, mobileNumber);

      if (otpResponse.status !== "success") {
        return {
          status: "error",
          message: "Failed to send OTP",
        };
      }

      return {
        status: "success",
        message: "NIC verified and OTP sent successfully",
        userData: nicVerification.data,
        transactionId: otpResponse.transactionId,
      };
    } catch (error: any) {
      console.error("Registration Initiation Error:", error);
      return {
        status: "error",
        message: error.message || "Failed to initiate registration",
      };
    }
  }

  // Complete registration after OTP verification
  async completeRegistration(
    transactionId: string,
    otp: string,
    registrationData: UserRegistrationData,
  ): Promise<{ status: string; message: string; userId?: string }> {
    try {
      // Step 1: Verify OTP
      const otpVerification = await awsDemoService.verifyOTP(
        transactionId,
        otp,
      );
      // For production, replace with: const otpVerification = await mosipService.verifyOTP(transactionId, otp);

      if (otpVerification.status !== "success" || !otpVerification.verified) {
        return {
          status: "error",
          message: otpVerification.message,
        };
      }

      // Step 2: Register user in DynamoDB
      const registration = await this.registerUser({
        ...registrationData,
        verified: true,
      });

      return registration;
    } catch (error: any) {
      console.error("Complete Registration Error:", error);
      return {
        status: "error",
        message: error.message || "Failed to complete registration",
      };
    }
  }
}

export default new ApiService();
