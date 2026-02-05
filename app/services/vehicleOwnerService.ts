import awsDynamoService from "./awsDynamoService";

export interface VehicleOwner {
  id: string;
  name: string;
  mobileNumber: string;
  status: "online" | "offline";
  nicNumber?: string;
  email?: string;
  registeredDate?: string;
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION_NAME = "parkmate-vehicles";

class VehicleOwnerService {
  /**
   * Get all vehicle owners
   */
  async getAllOwners(): Promise<VehicleOwner[]> {
    try {
      const result = await awsDynamoService.scan(COLLECTION_NAME);

      const owners: VehicleOwner[] = (result.items || []).map((data: any) => ({
        id: data.id || data.vehicleOwnerId,
        name: data.name,
        mobileNumber: data.mobileNumber,
        status: data.status || "online",
        nicNumber: data.nicNumber,
        email: data.email || "",
        registeredDate: data.registeredDate,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      }));

      // Sort desc by createdAt
      owners.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      return owners;
    } catch (error) {
      console.error("Error getting vehicle owners:", error);
      throw new Error("Failed to fetch vehicle owners");
    }
  }

  /**
   * Add a new vehicle owner
   */
  async addOwner(ownerData: Omit<VehicleOwner, "id">): Promise<VehicleOwner> {
    try {
      const id = `VO_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const newOwner = {
        id,
        ...ownerData,
        status: ownerData.status || "online",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await awsDynamoService.putItem(COLLECTION_NAME, newOwner);

      return newOwner;
    } catch (error) {
      console.error("Error adding vehicle owner:", error);
      throw new Error("Failed to add vehicle owner");
    }
  }

  /**
   * Update an existing vehicle owner
   */
  async updateOwner(
    ownerId: string,
    updates: Partial<VehicleOwner>,
  ): Promise<void> {
    try {
      await awsDynamoService.updateItem(
        COLLECTION_NAME,
        { id: ownerId },
        {
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      );
    } catch (error) {
      console.error("Error updating vehicle owner:", error);
      throw new Error("Failed to update vehicle owner");
    }
  }

  /**
   * Delete a vehicle owner
   */
  async deleteOwner(ownerId: string): Promise<void> {
    try {
      await awsDynamoService.deleteItem(COLLECTION_NAME, { id: ownerId });
    } catch (error) {
      console.error("Error deleting vehicle owner:", error);
      throw new Error("Failed to delete vehicle owner");
    }
  }

  /**
   * Search owners by name or mobile number
   */
  async searchOwners(searchTerm: string): Promise<VehicleOwner[]> {
    try {
      const result = await awsDynamoService.scan(COLLECTION_NAME);
      const allOwners = result.items || [];

      const owners: VehicleOwner[] = [];
      allOwners.forEach((data: any) => {
        const owner = {
          id: data.id,
          name: data.name,
          mobileNumber: data.mobileNumber,
          status: data.status || "online",
          nicNumber: data.nicNumber,
          email: data.email,
          registeredDate: data.registeredDate,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };

        // Filter by search term
        if (
          owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          owner.mobileNumber.includes(searchTerm)
        ) {
          owners.push(owner);
        }
      });

      return owners;
    } catch (error) {
      console.error("Error searching vehicle owners:", error);
      throw new Error("Failed to search vehicle owners");
    }
  }

  /**
   * Get owners by status
   */
  async getOwnersByStatus(
    status: "online" | "offline",
  ): Promise<VehicleOwner[]> {
    try {
      const result = await awsDynamoService.scan(COLLECTION_NAME);
      const allOwners = result.items || [];

      const owners: VehicleOwner[] = [];
      allOwners.forEach((data: any) => {
        if (data.status === status) {
          owners.push({
            id: data.id,
            name: data.name,
            mobileNumber: data.mobileNumber,
            status: data.status,
            nicNumber: data.nicNumber,
            email: data.email,
            registeredDate: data.registeredDate,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        }
      });

      // Sort desc by createdAt
      owners.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      return owners;
    } catch (error) {
      console.error("Error getting owners by status:", error);
      throw new Error("Failed to fetch owners by status");
    }
  }

  /**
   * Initialize with sample data (for testing)
   */
  async initializeSampleData(): Promise<void> {
    try {
      const sampleOwners = [
        {
          name: "Kasun Perera",
          mobileNumber: "071 333 8890",
          status: "online" as const,
          nicNumber: "199512345678",
          email: "kasun21@gmail.com",
          registeredDate: "2024-01-15",
        },
        {
          name: "Kamani Silva",
          mobileNumber: "078 122 7890",
          status: "online" as const,
          nicNumber: "199612345678",
          email: "kamani@email.com",
          registeredDate: "2024-02-20",
        },
        {
          name: "Saman Prakash",
          mobileNumber: "077 678 4567",
          status: "online" as const,
          nicNumber: "199712345678",
          email: "saman@email.com",
          registeredDate: "2024-03-10",
        },
        {
          name: "Prasanna Kaluganchchi",
          mobileNumber: "072 678 3456",
          status: "offline" as const,
          nicNumber: "199812345678",
          email: "prasanna@email.com",
          registeredDate: "2024-04-05",
        },
      ];

      for (const owner of sampleOwners) {
        await this.addOwner(owner);
      }

      console.log("Sample data initialized successfully");
    } catch (error) {
      console.error("Error initializing sample data:", error);
    }
  }

  /**
   * Get owner by NIC number
   */
  async getOwnerByNIC(nicNumber: string): Promise<VehicleOwner | null> {
    try {
      const result = await awsDynamoService.scan(COLLECTION_NAME);
      const allOwners = result.items || [];

      const ownerData = allOwners.find((o: any) => o.nicNumber === nicNumber);

      if (!ownerData) {
        return null;
      }

      const data = ownerData;

      return {
        id: data.id,
        name: data.name,
        mobileNumber: data.mobileNumber,
        status: data.status || "online",
        nicNumber: data.nicNumber,
        email: data.email,
        registeredDate: data.registeredDate,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error) {
      console.error("Error getting owner by NIC:", error);
      throw new Error("Failed to fetch owner by NIC");
    }
  }
}

export default new VehicleOwnerService();
