import awsDynamoService from "./awsDynamoService";

export interface FineChecker {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  municipalCouncil: string;
  status: "onDuty" | "offDuty";
  checkerId?: string;
  mobileNumber?: string;
  registeredDate?: string;
  profilePictureUrl?: string;
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION_NAME = "parkmate-users";

class FineCheckerService {
  /**
   * Get all fine checkers
   */
  async getAllFineCheckers(): Promise<FineChecker[]> {
    try {
      const result = await awsDynamoService.scan(COLLECTION_NAME);

      if (result.error) {
        throw new Error(result.error);
      }

      // Filter only fine checkers (userType === 'fine_checker')
      const checkerItems = result.items.filter(
        (item: any) => item.userType === "fine_checker",
      );

      const checkers: FineChecker[] = checkerItems.map((item: any) => ({
        id:
          item.id ||
          item.checkerId ||
          item.userId ||
          `checker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fullName: item.fullName,
        email: item.email,
        municipalCouncil: item.municipalCouncil,
        status: item.status || "offDuty",
        checkerId: item.checkerId,
        mobileNumber: item.mobileNumber,
        registeredDate: item.registeredDate,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));

      // Sort by createdAt descending
      checkers.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      return checkers;
    } catch (error) {
      console.error("Error getting fine checkers:", error);
      throw new Error("Failed to fetch fine checkers");
    }
  }

  /**
   * Get fine checker by ID
   */
  async getFineCheckerById(checkerId: string): Promise<FineChecker | null> {
    try {
      const result = await awsDynamoService.getItem(COLLECTION_NAME, {
        userId: checkerId,
      });

      if (!result.item) {
        return null;
      }

      const data = result.item;
      return {
        id: data.id || data.checkerId,
        fullName: data.fullName,
        email: data.email,
        municipalCouncil: data.municipalCouncil,
        status: data.status || "offDuty",
        checkerId: data.checkerId,
        mobileNumber: data.mobileNumber,
        registeredDate: data.registeredDate,
        profilePictureUrl: data.profilePictureUrl,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error) {
      console.error("Error getting fine checker by ID:", error);
      return null;
    }
  }

  /**
   * Add a new fine checker
   */
  async addFineChecker(
    checkerData: Omit<FineChecker, "id">,
  ): Promise<FineChecker> {
    try {
      const checkerId =
        checkerData.checkerId ||
        `CHK_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const newChecker = {
        ...checkerData,
        userId: checkerId, // DynamoDB partition key
        id: checkerId,
        checkerId,
        role: "fine_checker", // Role for fine checker
        userType: "fine_checker", // Identify as fine checker
        status: checkerData.status || "offDuty",
        registeredDate: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await awsDynamoService.putItem(COLLECTION_NAME, newChecker);

      return {
        id: checkerId,
        ...checkerData,
      };
    } catch (error) {
      console.error("Error adding fine checker:", error);
      throw new Error("Failed to add fine checker");
    }
  }

  /**
   * Update an existing fine checker
   */
  async updateFineChecker(
    checkerId: string,
    updates: Partial<FineChecker>,
  ): Promise<void> {
    try {
      await awsDynamoService.updateItem(
        COLLECTION_NAME,
        { userId: checkerId },
        {
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      );
    } catch (error) {
      console.error("Error updating fine checker:", error);
      throw new Error("Failed to update fine checker");
    }
  }

  /**
   * Delete a fine checker
   */
  async deleteFineChecker(checkerId: string): Promise<void> {
    try {
      await awsDynamoService.deleteItem(COLLECTION_NAME, {
        userId: checkerId,
      });
    } catch (error) {
      console.error("Error deleting fine checker:", error);
      throw new Error("Failed to delete fine checker");
    }
  }

  /**
   * Update fine checker status (onDuty/offDuty)
   */
  async updateFineCheckerStatus(
    checkerId: string,
    status: "onDuty" | "offDuty",
  ): Promise<{ status: string; message: string }> {
    try {
      await awsDynamoService.updateItem(
        COLLECTION_NAME,
        { userId: checkerId },
        {
          status: status,
          updatedAt: new Date().toISOString(),
        },
      );

      console.log(`✅ Fine checker status updated to ${status}`);
      return {
        status: "success",
        message: `Status updated to ${status}`,
      };
    } catch (error) {
      console.error("Error updating fine checker status:", error);
      return {
        status: "error",
        message: "Failed to update status",
      };
    }
  }

  /**
   * Get fine checkers by municipal council
   */
  async getFineCheckersByCouncil(
    municipalCouncil: string,
  ): Promise<FineChecker[]> {
    try {
      const result = await awsDynamoService.scan(COLLECTION_NAME, {
        municipalCouncil,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Filter by userType and municipalCouncil
      const filteredItems = result.items.filter(
        (item: any) =>
          item.userType === "fine_checker" &&
          item.municipalCouncil === municipalCouncil,
      );

      const checkers = filteredItems.map((item: any) => ({
        id:
          item.id ||
          item.checkerId ||
          item.userId ||
          `checker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fullName: item.fullName,
        email: item.email,
        municipalCouncil: item.municipalCouncil,
        status: item.status || "offDuty",
        checkerId: item.checkerId,
        mobileNumber: item.mobileNumber,
        registeredDate: item.registeredDate,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));

      // Sort by createdAt descending
      checkers.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      return checkers;
    } catch (error) {
      console.error("Error getting fine checkers by council:", error);
      throw new Error("Failed to fetch fine checkers by council");
    }
  }

  /**
   * Get fine checkers by status
   */
  async getFineCheckersByStatus(
    status: "onDuty" | "offDuty",
  ): Promise<FineChecker[]> {
    try {
      const result = await awsDynamoService.scan(COLLECTION_NAME, { status });

      if (result.error) {
        throw new Error(result.error);
      }

      // Filter by userType and status
      const filteredItems = result.items.filter(
        (item: any) =>
          item.userType === "fine_checker" && item.status === status,
      );

      const checkers = filteredItems.map((item: any) => ({
        id:
          item.id ||
          item.checkerId ||
          item.userId ||
          `checker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fullName: item.fullName,
        email: item.email,
        municipalCouncil: item.municipalCouncil,
        status: item.status,
        checkerId: item.checkerId,
        mobileNumber: item.mobileNumber,
        registeredDate: item.registeredDate,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));

      // Sort by createdAt descending
      checkers.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      return checkers;
    } catch (error) {
      console.error("Error getting fine checkers by status:", error);
      throw new Error("Failed to fetch fine checkers by status");
    }
  }

  /**
   * Verify fine checker login credentials
   */
  async verifyFineCheckerLogin(
    email: string,
    password: string,
  ): Promise<{ status: string; message: string; checker?: FineChecker }> {
    try {
      console.log("🔍 Verifying fine checker login:", { email });

      const result = await awsDynamoService.scan(COLLECTION_NAME);

      if (result.error || result.items.length === 0) {
        console.log("❌ Email not found");
        return {
          status: "error",
          message: "Email not found. Please check your credentials.",
        };
      }

      // Filter by userType and email
      const checkers = result.items.filter(
        (item: any) => item.userType === "fine_checker" && item.email === email,
      );

      if (checkers.length === 0) {
        console.log("❌ Email not found");
        return {
          status: "error",
          message: "Email not found. Please check your credentials.",
        };
      }

      const matchedItem = checkers.find(
        (item: any) => item.password === password,
      );

      if (!matchedItem) {
        console.log("❌ Password does not match");
        return {
          status: "error",
          message: "Password does not match. Please check your credentials.",
        };
      }

      const matchedChecker: FineChecker = {
        id: matchedItem.id || matchedItem.checkerId,
        fullName: matchedItem.fullName,
        email: matchedItem.email,
        municipalCouncil: matchedItem.municipalCouncil,
        status: matchedItem.status || "offDuty",
        checkerId: matchedItem.checkerId,
        mobileNumber: matchedItem.mobileNumber,
        registeredDate: matchedItem.registeredDate,
        createdAt: matchedItem.createdAt,
        updatedAt: matchedItem.updatedAt,
      };

      console.log("✅ Fine checker verified:");
      return {
        status: "success",
        message: "Fine checker verified successfully",
        checker: matchedChecker,
      };
    } catch (error) {
      console.error("Error verifying fine checker login:", error);
      return {
        status: "error",
        message: "Failed to verify credentials. Please try again.",
      };
    }
  }
}

export default new FineCheckerService();
