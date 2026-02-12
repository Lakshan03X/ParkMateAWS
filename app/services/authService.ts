import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_KEY = "parkmate_auth";
const USER_DATA_KEY = "parkmate_user_data";

export interface AuthData {
  userId: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  nicNumber?: string;
  profileComplete?: boolean;
  userType: "vehicle-owner" | "staff";
}

class AuthService {
  /**
   * Save authentication data to AsyncStorage
   */
  async login(userData: AuthData): Promise<void> {
    try {
      await AsyncStorage.setItem(AUTH_KEY, "true");
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      console.log("✅ User logged in and saved to storage:", userData.userId);
    } catch (error) {
      console.error("Error saving auth data:", error);
      throw error;
    }
  }

  /**
   * Remove authentication data from AsyncStorage
   */
  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(AUTH_KEY);
      await AsyncStorage.removeItem(USER_DATA_KEY);
      console.log("✅ User logged out and auth data cleared");
    } catch (error) {
      console.error("Error clearing auth data:", error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const authValue = await AsyncStorage.getItem(AUTH_KEY);
      return authValue === "true";
    } catch (error) {
      console.error("Error checking auth status:", error);
      return false;
    }
  }

  /**
   * Get stored user data
   */
  async getUserData(): Promise<AuthData | null> {
    try {
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      console.error("Error getting user data:", error);
      return null;
    }
  }

  /**
   * Update stored user data (e.g., after profile update)
   */
  async updateUserData(userData: Partial<AuthData>): Promise<void> {
    try {
      const currentData = await this.getUserData();
      if (currentData) {
        const updatedData = { ...currentData, ...userData };
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedData));
        console.log("✅ User data updated in storage");
      }
    } catch (error) {
      console.error("Error updating user data:", error);
      throw error;
    }
  }
}

export default new AuthService();
