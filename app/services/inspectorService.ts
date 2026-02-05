import awsDynamoService from "./awsDynamoService";

export interface Inspector {
  id: string;
  name: string;
  mobileNumber: string;
  status: "online" | "offline" | "pending";
  inspectorId?: string;
  email?: string;
  registeredDate?: string;
  municipalCouncil?: string;
  assignedZone?: string;
  isAssigned?: boolean;
  profilePictureUrl?: string;
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION_NAME = "parkmate-users";

class InspectorService {
  /**
   * Get all inspectors
   */
  async getAllInspectors(): Promise<Inspector[]> {
    try {
      const result = await awsDynamoService.scan(COLLECTION_NAME);

      if (result.error) {
        throw new Error(result.error);
      }

      const inspectors: Inspector[] = result.items.map((item: any) => ({
        id: item.id || item.inspectorId || item.userId || `inspector_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: item.name,
        mobileNumber: item.mobileNumber,
        status: item.status || "online",
        inspectorId: item.inspectorId,
        email: item.email,
        registeredDate: item.registeredDate,
        municipalCouncil: item.municipalCouncil,
        assignedZone: item.assignedZone,
        isAssigned: item.isAssigned || false,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));

      // Sort by createdAt descending
      inspectors.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      return inspectors;
    } catch (error) {
      console.error("Error getting inspectors:", error);
      throw new Error("Failed to fetch inspectors");
    }
  }

  /**
   * Verify inspector login credentials
   */
  async verifyInspectorLogin(
    employeeId: string,
    mobileNumber: string
  ): Promise<{ status: string; message: string; inspector?: Inspector }> {
    try {
      console.log("🔍 Verifying inspector login:", {
        employeeId,
        mobileNumber,
      });

      const result = await awsDynamoService.getItem(COLLECTION_NAME, {
        inspectorId: employeeId,
      });

      if (!result.item) {
        console.log("❌ Inspector ID not found");
        return {
          status: "error",
          message: "Employee ID not found. Please check your credentials.",
        };
      }

      const data = result.item;
      const inspector: Inspector = {
        id: data.id || data.inspectorId || data.userId || `inspector_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: data.name,
        mobileNumber: data.mobileNumber,
        status: data.status || "online",
        inspectorId: data.inspectorId,
        email: data.email,
        registeredDate: data.registeredDate,
        municipalCouncil: data.municipalCouncil,
        assignedZone: data.assignedZone,
        isAssigned: data.isAssigned || false,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      // Normalize mobile numbers for comparison (remove spaces and dashes)
      const normalizedInputNumber = mobileNumber.replace(/[\s-]/g, "");
      const normalizedInspectorNumber = inspector.mobileNumber.replace(
        /[\s-]/g,
        ""
      );

      if (normalizedInputNumber !== normalizedInspectorNumber) {
        console.log("❌ Mobile number does not match");
        return {
          status: "error",
          message:
            "Mobile number does not match. Please check your credentials.",
        };
      }

      console.log("✅ Inspector verified:", inspector.name);
      return {
        status: "success",
        message: "Inspector verified successfully",
        inspector,
      };
    } catch (error) {
      console.error("Error verifying inspector login:", error);
      return {
        status: "error",
        message: "Failed to verify credentials. Please try again.",
      };
    }
  }

  /**
   * Update inspector status (online/offline)
   */
  async updateInspectorStatus(
    inspectorId: string,
    status: "online" | "offline"
  ): Promise<{ status: string; message: string }> {
    try {
      const result = await awsDynamoService.updateItem(
        COLLECTION_NAME,
        { inspectorId },
        {
          status: status,
          updatedAt: new Date().toISOString(),
        }
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to update status");
      }

      console.log(`✅ Inspector status updated to ${status}`);
      return {
        status: "success",
        message: `Status updated to ${status}`,
      };
    } catch (error) {
      console.error("Error updating inspector status:", error);
      return {
        status: "error",
        message: "Failed to update status",
      };
    }
  }

  /**
   * Get inspector by ID
   */
  async getInspectorById(inspectorId: string): Promise<Inspector | null> {
    try {
      const result = await awsDynamoService.getItem(COLLECTION_NAME, {
        inspectorId,
      });

      if (!result.item) {
        return null;
      }

      const data = result.item;
      return {
        id: data.id || data.inspectorId || data.userId || `inspector_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: data.name,
        mobileNumber: data.mobileNumber,
        status: data.status || "online",
        inspectorId: data.inspectorId,
        email: data.email,
        registeredDate: data.registeredDate,
        municipalCouncil: data.municipalCouncil,
        assignedZone: data.assignedZone,
        isAssigned: data.isAssigned || false,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error) {
      console.error("Error getting inspector by ID:", error);
      return null;
    }
  }

  /**
   * Add a new inspector
   */
  async addInspector(
    inspectorData: Omit<Inspector, "id">
  ): Promise<{ status: string; message: string; inspectorId?: string }> {
    try {
      const inspectorId =
        inspectorData.inspectorId ||
        `INS_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const newInspector = {
        ...inspectorData,
        id: inspectorId,
        inspectorId,
        status: inspectorData.status || "pending",
        isAssigned: inspectorData.isAssigned || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await awsDynamoService.putItem(
        COLLECTION_NAME,
        newInspector
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to add inspector");
      }

      console.log("✅ Inspector added successfully:", inspectorId);
      return {
        status: "success",
        message: "Inspector added successfully",
        inspectorId,
      };
    } catch (error) {
      console.error("Error adding inspector:", error);
      return {
        status: "error",
        message: "Failed to add inspector",
      };
    }
  }

  /**
   * Update inspector details
   */
  async updateInspector(
    inspectorId: string,
    updates: Partial<Inspector>
  ): Promise<{ status: string; message: string }> {
    try {
      const result = await awsDynamoService.updateItem(
        COLLECTION_NAME,
        { inspectorId },
        {
          ...updates,
          updatedAt: new Date().toISOString(),
        }
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to update inspector");
      }

      console.log("✅ Inspector updated successfully");
      return {
        status: "success",
        message: "Inspector updated successfully",
      };
    } catch (error) {
      console.error("Error updating inspector:", error);
      return {
        status: "error",
        message: "Failed to update inspector",
      };
    }
  }

  /**
   * Delete inspector
   */
  async deleteInspector(
    inspectorId: string
  ): Promise<{ status: string; message: string }> {
    try {
      const result = await awsDynamoService.deleteItem(COLLECTION_NAME, {
        inspectorId,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to delete inspector");
      }

      console.log("✅ Inspector deleted successfully");
      return {
        status: "success",
        message: "Inspector deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting inspector:", error);
      return {
        status: "error",
        message: "Failed to delete inspector",
      };
    }
  }

  /**
   * Assign zone to inspector
   */
  async assignZoneToInspector(
    inspectorId: string,
    zoneId: string
  ): Promise<{ status: string; message: string }> {
    try {
      const result = await awsDynamoService.updateItem(
        COLLECTION_NAME,
        { inspectorId },
        {
          assignedZone: zoneId,
          isAssigned: true,
          updatedAt: new Date().toISOString(),
        }
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to assign zone");
      }

      console.log("✅ Zone assigned successfully");
      return {
        status: "success",
        message: "Zone assigned successfully",
      };
    } catch (error) {
      console.error("Error assigning zone:", error);
      return {
        status: "error",
        message: "Failed to assign zone",
      };
    }
  }

  /**
   * Get inspectors by municipal council
   */
  async getInspectorsByCouncil(municipalCouncil: string): Promise<Inspector[]> {
    try {
      const result = await awsDynamoService.scan(COLLECTION_NAME, {
        municipalCouncil,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      return result.items.map((item: any) => ({
        id: item.id || item.inspectorId,
        name: item.name,
        mobileNumber: item.mobileNumber,
        status: item.status || "online",
        inspectorId: item.inspectorId,
        email: item.email,
        registeredDate: item.registeredDate,
        municipalCouncil: item.municipalCouncil,
        assignedZone: item.assignedZone,
        isAssigned: item.isAssigned || false,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));
    } catch (error) {
      console.error("Error getting inspectors by council:", error);
      return [];
    }
  }
}

export default new InspectorService();
