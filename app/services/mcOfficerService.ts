import awsDynamoService from "./awsDynamoService";

export interface MCOfficer {
  id: string;
  name: string;
  mobileNumber: string;
  zone: string;
  status: "on duty" | "off duty";
  email?: string;
  officerId?: string;
  registeredDate?: string;
  createdAt?: any;
  updatedAt?: any;
  password?: string;
  councilId?: string;
  selectedCouncil?: string;
}

const COLLECTION_NAME = "parkmate-users";

class MCOfficerService {
  /**
   * Get all MC Officers
   */
  async getAllOfficers(): Promise<MCOfficer[]> {
    try {
      const result = await awsDynamoService.scan(COLLECTION_NAME);

      // Filter only MC officers (userType === 'mc_officer')
      const officerItems = (result.items || []).filter(
        (item: any) => item.userType === "mc_officer",
      );

      const officers: MCOfficer[] = officerItems.map((data: any) => ({
        id: data.id,
        name: data.name,
        mobileNumber: data.mobileNumber,
        zone: data.zone,
        status: data.status || "on duty",
        email: data.email,
        officerId: data.officerId,
        registeredDate: data.registeredDate,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        password: data.password,
        councilId: data.councilId,
        selectedCouncil: data.selectedCouncil,
      }));

      // Sort desc by createdAt
      officers.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA;
      });

      return officers;
    } catch (error) {
      console.error("Error getting MC officers:", error);
      throw new Error("Failed to fetch MC officers");
    }
  }

  /**
   * Add a new MC Officer
   */
  async addOfficer(officerData: Omit<MCOfficer, "id">): Promise<MCOfficer> {
    try {
      const id = `OFFICER_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const newOfficer = {
        userId: id, // DynamoDB partition key
        id,
        ...officerData,
        role: "mc_officer", // Role for MC officer
        userType: "mc_officer", // Identify as MC officer
        status: officerData.status || "on duty",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await awsDynamoService.putItem(COLLECTION_NAME, newOfficer);

      return newOfficer;
    } catch (error) {
      console.error("Error adding MC officer:", error);
      throw new Error("Failed to add MC officer");
    }
  }

  /**
   * Update an existing MC Officer
   */
  async updateOfficer(
    officerId: string,
    updates: Partial<MCOfficer>,
  ): Promise<void> {
    try {
      await awsDynamoService.updateItem(
        COLLECTION_NAME,
        { userId: officerId },
        {
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      );
    } catch (error) {
      console.error("Error updating MC officer:", error);
      throw new Error("Failed to update MC officer");
    }
  }

  /**
   * Delete an MC Officer
   */
  async deleteOfficer(officerId: string): Promise<void> {
    try {
      console.log("Deleting MC officer with ID:", officerId);
      console.log("Sending delete request with key:", { userId: officerId });

      const result = await awsDynamoService.deleteItem(COLLECTION_NAME, {
        userId: officerId,
      });

      console.log("Delete operation result:", result);
    } catch (error) {
      console.error("Error deleting MC officer:", error);
      throw new Error("Failed to delete MC officer");
    }
  }

  /**
   * Search MC Officers by name or mobile number
   */
  async searchOfficers(searchTerm: string): Promise<MCOfficer[]> {
    try {
      const result = await awsDynamoService.scan(COLLECTION_NAME);
      const allOfficers = result.items || [];

      const officers: MCOfficer[] = [];
      allOfficers.forEach((data: any) => {
        const officer = {
          id: data.id,
          name: data.name,
          mobileNumber: data.mobileNumber,
          zone: data.zone,
          status: data.status || "on duty",
          email: data.email,
          officerId: data.officerId,
          registeredDate: data.registeredDate,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          password: data.password,
          councilId: data.councilId,
          selectedCouncil: data.selectedCouncil,
        };

        // Filter by search term
        if (
          officer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          officer.mobileNumber.includes(searchTerm)
        ) {
          officers.push(officer);
        }
      });

      return officers;
    } catch (error) {
      console.error("Error searching MC officers:", error);
      throw new Error("Failed to search MC officers");
    }
  }

  /**
   * Get MC Officers by status
   */
  async getOfficersByStatus(
    status: "on duty" | "off duty",
  ): Promise<MCOfficer[]> {
    try {
      const result = await awsDynamoService.scan(COLLECTION_NAME);
      const allOfficers = result.items || [];

      const officers: MCOfficer[] = [];
      allOfficers.forEach((data: any) => {
        if (data.status === status) {
          officers.push({
            id: data.id,
            name: data.name,
            mobileNumber: data.mobileNumber,
            zone: data.zone,
            status: data.status,
            email: data.email,
            officerId: data.officerId,
            registeredDate: data.registeredDate,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            password: data.password,
            councilId: data.councilId,
            selectedCouncil: data.selectedCouncil,
          });
        }
      });

      return officers;
    } catch (error) {
      console.error("Error getting MC officers by status:", error);
      throw new Error("Failed to fetch MC officers by status");
    }
  }

  /**
   * Login MC Officer
   */
  async loginOfficer(
    councilId: string,
    email: string,
    password: string,
  ): Promise<MCOfficer | null> {
    try {
      const result = await awsDynamoService.scan(COLLECTION_NAME);
      const allOfficers = result.items || [];

      const officer = allOfficers.find(
        (o: any) =>
          o.councilId === councilId &&
          o.email === email &&
          o.password === password,
      );

      if (officer) {
        return {
          id: officer.id,
          name: officer.name,
          mobileNumber: officer.mobileNumber,
          zone: officer.zone,
          status: officer.status || "on duty",
          email: officer.email,
          officerId: officer.officerId,
          registeredDate: officer.registeredDate,
          createdAt: officer.createdAt,
          updatedAt: officer.updatedAt,
          password: officer.password,
          councilId: officer.councilId,
          selectedCouncil: officer.selectedCouncil,
        };
      }

      return null;
    } catch (error) {
      console.error("Error logging in MC officer:", error);
      throw new Error("Failed to login MC officer");
    }
  }

  /**
   * Update MC Officer's selected council
   */
  async updateOfficerCouncil(
    officerId: string,
    selectedCouncil: string,
  ): Promise<void> {
    try {
      await awsDynamoService.updateItem(
        COLLECTION_NAME,
        { userId: officerId },
        {
          selectedCouncil: selectedCouncil,
          updatedAt: new Date().toISOString(),
        },
      );
    } catch (error) {
      console.error("Error updating officer council:", error);
      throw new Error("Failed to update officer council");
    }
  }
}

export default new MCOfficerService();
