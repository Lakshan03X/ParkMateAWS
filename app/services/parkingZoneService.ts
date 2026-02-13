import awsDynamoService from "./awsDynamoService";

export interface ParkingZone {
  id: string;
  municipalCouncil: string;
  zoneCode: string;
  name?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  parkingRate: string;
  activeHours: string;
  totalParkingSpots: string;
  availableSpots?: number;
  parkingSections?: string;
  status: "active" | "inactive";
  inactiveReason?: string;
  verificationStatus?: "pending" | "verified" | "rejected";
  createdBy?: string; // MC Officer ID who created the zone
  verifiedBy?: string; // MC Admin ID who verified/rejected
  rejectionReason?: string;
  assignedInspectors?: string[]; // Array of inspector IDs assigned to this zone
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION_NAME = "parkmate-parking-zones";

class ParkingZoneService {
  /**
   * Get all parking zones
   */
  async getAllParkingZones(): Promise<ParkingZone[]> {
    try {
      const result = await awsDynamoService.scan(COLLECTION_NAME);

      const zones: ParkingZone[] = (result.items || []).map((data: any) => ({
        id: data.id,
        municipalCouncil: data.municipalCouncil,
        zoneCode: data.zoneCode,
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
        parkingRate: data.parkingRate,
        activeHours: data.activeHours,
        totalParkingSpots: data.totalParkingSpots,
        availableSpots:
          data.availableSpots ?? parseInt(data.totalParkingSpots || "0"),
        parkingSections: data.parkingSections,
        status: data.status || "active",
        inactiveReason: data.inactiveReason,
        verificationStatus: data.verificationStatus || "verified", // Default to verified for backward compatibility
        createdBy: data.createdBy,
        verifiedBy: data.verifiedBy,
        rejectionReason: data.rejectionReason,
        assignedInspectors: data.assignedInspectors || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      }));

      // Sort by createdAt desc
      zones.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA;
      });

      return zones;
    } catch (error) {
      console.error("Error getting parking zones:", error);
      throw new Error("Failed to fetch parking zones");
    }
  }

  /**
   * Get parking zone by ID
   */
  async getParkingZoneById(zoneId: string): Promise<ParkingZone | null> {
    try {
      const result = await awsDynamoService.getItem(COLLECTION_NAME, {
        zoneId: zoneId, // Use zoneId as primary key
      });

      if (result.item) {
        const data = result.item;
        return {
          id: data.id || data.zoneId,
          municipalCouncil: data.municipalCouncil,
          zoneCode: data.zoneCode,
          location: data.location,
          latitude: data.latitude,
          longitude: data.longitude,
          parkingRate: data.parkingRate,
          activeHours: data.activeHours,
          totalParkingSpots: data.totalParkingSpots,
          parkingSections: data.parkingSections,
          status: data.status || "active",
          activeHours: data.activeHours,
          totalParkingSpots: data.totalParkingSpots,
          status: data.status || "active",
          inactiveReason: data.inactiveReason,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      }

      return null;
    } catch (error) {
      console.error("Error getting parking zone by ID:", error);
      return null;
    }
  }

  /**
   * Add a new parking zone
   */
  async addParkingZone(
    zoneData: Omit<ParkingZone, "id">,
  ): Promise<ParkingZone> {
    try {
      const id = `ZONE_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const newZone = {
        id,
        zoneId: id, // DynamoDB table uses zoneId as primary key
        ...zoneData,
        status: zoneData.status || "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await awsDynamoService.putItem(COLLECTION_NAME, newZone);

      return newZone;
    } catch (error) {
      console.error("Error adding parking zone:", error);
      throw new Error("Failed to add parking zone");
    }
  }

  /**
   * Update an existing parking zone
   */
  async updateParkingZone(
    zoneId: string,
    updates: Partial<ParkingZone>,
  ): Promise<void> {
    try {
      await awsDynamoService.updateItem(
        COLLECTION_NAME,
        { zoneId: zoneId }, // Use zoneId as primary key
        {
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      );
    } catch (error) {
      console.error("Error updating parking zone:", error);
      throw new Error("Failed to update parking zone");
    }
  }

  /**
   * Delete a parking zone
   */
  async deleteParkingZone(zoneId: string): Promise<void> {
    try {
      await awsDynamoService.deleteItem(COLLECTION_NAME, { zoneId: zoneId }); // Use zoneId as primary key
    } catch (error) {
      console.error("Error deleting parking zone:", error);
      throw new Error("Failed to delete parking zone");
    }
  }

  /**
   * Update parking zone status with reason
   */
  async updateZoneStatus(
    zoneId: string,
    status: "active" | "inactive",
    inactiveReason?: string,
  ): Promise<void> {
    try {
      const updateData: any = {
        status: status,
        updatedAt: new Date().toISOString(),
      };

      if (status === "inactive" && inactiveReason) {
        updateData.inactiveReason = inactiveReason;
      } else if (status === "active") {
        updateData.inactiveReason = "";
      }

      await awsDynamoService.updateItem(
        COLLECTION_NAME,
        { zoneId: zoneId }, // Use zoneId as primary key
        updateData,
      );
    } catch (error) {
      console.error("Error updating zone status:", error);
      throw new Error("Failed to update zone status");
    }
  }

  /**
   * Get parking zones by status
   */
  async getParkingZonesByStatus(
    status: "active" | "inactive",
  ): Promise<ParkingZone[]> {
    try {
      const result = await awsDynamoService.scan(COLLECTION_NAME);
      const allZones = result.items || [];

      const zones: ParkingZone[] = [];
      allZones.forEach((data: any) => {
        if (data.status === status) {
          zones.push({
            id: data.id,
            municipalCouncil: data.municipalCouncil,
            zoneCode: data.zoneCode,
            location: data.location,
            latitude: data.latitude,
            longitude: data.longitude,
            parkingRate: data.parkingRate,
            activeHours: data.activeHours,
            totalParkingSpots: data.totalParkingSpots,
            status: data.status,
            inactiveReason: data.inactiveReason,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        }
      });

      // Sort by createdAt locally
      zones.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA;
      });

      return zones;
    } catch (error) {
      console.error("Error getting parking zones by status:", error);
      throw new Error("Failed to fetch parking zones by status");
    }
  }

  /**
   * Search parking zones
   */
  async searchParkingZones(searchTerm: string): Promise<ParkingZone[]> {
    try {
      const result = await awsDynamoService.scan(COLLECTION_NAME);
      const allZones = result.items || [];

      const zones: ParkingZone[] = [];
      allZones.forEach((data: any) => {
        const zone = {
          id: data.id,
          municipalCouncil: data.municipalCouncil,
          zoneCode: data.zoneCode,
          location: data.location,
          latitude: data.latitude,
          longitude: data.longitude,
          parkingRate: data.parkingRate,
          activeHours: data.activeHours,
          totalParkingSpots: data.totalParkingSpots,
          status: data.status || "active",
          inactiveReason: data.inactiveReason,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };

        // Filter by search term
        if (
          zone.municipalCouncil
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          zone.zoneCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          zone.location.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          zones.push(zone);
        }
      });

      return zones;
    } catch (error) {
      console.error("Error searching parking zones:", error);
      throw new Error("Failed to search parking zones");
    }
  }

  /**
   * Get all parking zones (alias for getAllParkingZones)
   */
  async getAllZones(): Promise<ParkingZone[]> {
    return this.getAllParkingZones();
  }

  /**
   * Get parking zones by municipal council
   */
  async getZonesByMunicipalCouncil(
    municipalCouncil: string,
  ): Promise<ParkingZone[]> {
    try {
      const result = await awsDynamoService.scan(COLLECTION_NAME);
      const allZones = result.items || [];

      const zones: ParkingZone[] = [];
      allZones.forEach((data: any) => {
        if (data.municipalCouncil === municipalCouncil) {
          zones.push({
            id: data.id,
            municipalCouncil: data.municipalCouncil,
            zoneCode: data.zoneCode,
            location: data.location,
            latitude: data.latitude,
            longitude: data.longitude,
            parkingRate: data.parkingRate,
            activeHours: data.activeHours,
            totalParkingSpots: data.totalParkingSpots,
            status: data.status || "active",
            inactiveReason: data.inactiveReason,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        }
      });

      return zones;
    } catch (error) {
      console.error("Error getting zones by municipal council:", error);
      throw new Error("Failed to fetch zones by municipal council");
    }
  }

  /**
   * Decrease available spots (when parking ticket is created)
   */
  async decreaseAvailableSpots(parkingZone: string): Promise<void> {
    try {
      const result = await awsDynamoService.scan(COLLECTION_NAME);
      const allZones = result.items || [];

      // Extract zone code and location from formatted string (e.g., "Zone A - Location Name")
      let zoneCodeToSearch = "";
      let locationToSearch = parkingZone;

      if (parkingZone.includes(" - ")) {
        const parts = parkingZone.split(" - ");
        zoneCodeToSearch = parts[0].trim();
        locationToSearch = parts[1].trim();
      }

      // Find the exact zone by matching both zoneCode AND location
      const foundZone = allZones.find((zone: any) => {
        const zoneMatches = zoneCodeToSearch
          ? zone.zoneCode === zoneCodeToSearch
          : true;
        const locationMatches = zone.location === locationToSearch;
        return zoneMatches && locationMatches;
      });

      if (foundZone) {
        const totalSpots = parseInt(foundZone.totalParkingSpots || "0");
        const currentAvailable = foundZone.availableSpots ?? totalSpots;

        if (currentAvailable > 0) {
          await awsDynamoService.updateItem(
            COLLECTION_NAME,
            { zoneId: foundZone.id },
            {
              availableSpots: currentAvailable - 1,
              updatedAt: new Date().toISOString(),
            },
          );
          console.log(
            `✅ Decreased available spots for ${foundZone.municipalCouncil} - Zone ${foundZone.zoneCode} (${foundZone.location}): ${currentAvailable} → ${currentAvailable - 1}`,
          );
        } else {
          console.warn(`⚠️ No available spots in ${parkingZone}`);
        }
      } else {
        console.error(`❌ Parking zone not found: ${parkingZone}`);
      }
    } catch (error) {
      console.error("Error decreasing available spots:", error);
    }
  }

  /**
   * Increase available spots (when parking ticket is cancelled or completed)
   */
  async increaseAvailableSpots(parkingZone: string): Promise<void> {
    try {
      const result = await awsDynamoService.scan(COLLECTION_NAME);
      const allZones = result.items || [];

      // Extract zone code and location from formatted string
      let zoneCodeToSearch = "";
      let locationToSearch = parkingZone;

      if (parkingZone.includes(" - ")) {
        const parts = parkingZone.split(" - ");
        zoneCodeToSearch = parts[0].trim();
        locationToSearch = parts[1].trim();
      }

      // Find the exact zone by matching both zoneCode AND location
      const foundZone = allZones.find((zone: any) => {
        const zoneMatches = zoneCodeToSearch
          ? zone.zoneCode === zoneCodeToSearch
          : true;
        const locationMatches = zone.location === locationToSearch;
        return zoneMatches && locationMatches;
      });

      if (foundZone) {
        const totalSpots = parseInt(foundZone.totalParkingSpots || "0");
        const currentAvailable = foundZone.availableSpots ?? totalSpots;

        if (currentAvailable < totalSpots) {
          await awsDynamoService.updateItem(
            COLLECTION_NAME,
            { zoneId: foundZone.id },
            {
              availableSpots: currentAvailable + 1,
              updatedAt: new Date().toISOString(),
            },
          );
          console.log(
            `✅ Increased available spots for ${foundZone.municipalCouncil} - Zone ${foundZone.zoneCode} (${foundZone.location}): ${currentAvailable} → ${currentAvailable + 1}`,
          );
        } else {
          console.log(
            `ℹ️ Parking zone ${parkingZone} already at full capacity (${totalSpots}/${totalSpots})`,
          );
        }
      } else {
        console.error(`❌ Parking zone not found: ${parkingZone}`);
      }
    } catch (error) {
      console.error("Error increasing available spots:", error);
    }
  }

  /**
   * Get pending parking zones waiting for verification
   */
  async getPendingZones(): Promise<ParkingZone[]> {
    try {
      const allZones = await this.getAllParkingZones();
      return allZones.filter((zone) => zone.verificationStatus === "pending");
    } catch (error) {
      console.error("Error getting pending zones:", error);
      throw new Error("Failed to fetch pending zones");
    }
  }

  /**
   * Get verified parking zones
   */
  async getVerifiedZones(): Promise<ParkingZone[]> {
    try {
      const allZones = await this.getAllParkingZones();
      return allZones.filter(
        (zone) =>
          zone.verificationStatus === "verified" || !zone.verificationStatus,
      );
    } catch (error) {
      console.error("Error getting verified zones:", error);
      throw new Error("Failed to fetch verified zones");
    }
  }

  /**
   * Verify a parking zone (MC Admin)
   */
  async verifyZone(zoneId: string, adminId: string): Promise<void> {
    try {
      await awsDynamoService.updateItem(
        COLLECTION_NAME,
        { zoneId: zoneId },
        {
          verificationStatus: "verified",
          verifiedBy: adminId,
          status: "active",
          updatedAt: new Date().toISOString(),
        },
      );
      console.log(`✅ Zone ${zoneId} verified by admin ${adminId}`);
    } catch (error) {
      console.error("Error verifying zone:", error);
      throw new Error("Failed to verify parking zone");
    }
  }

  /**
   * Reject a parking zone (MC Admin)
   */
  async rejectZone(
    zoneId: string,
    adminId: string,
    reason: string,
  ): Promise<void> {
    try {
      await awsDynamoService.updateItem(
        COLLECTION_NAME,
        { zoneId: zoneId },
        {
          verificationStatus: "rejected",
          verifiedBy: adminId,
          rejectionReason: reason,
          status: "inactive",
          updatedAt: new Date().toISOString(),
        },
      );
      console.log(`❌ Zone ${zoneId} rejected by admin ${adminId}: ${reason}`);
    } catch (error) {
      console.error("Error rejecting zone:", error);
      throw new Error("Failed to reject parking zone");
    }
  }

  /**
   * Assign inspectors to a parking zone
   */
  async assignInspectorsToZone(
    zoneId: string,
    inspectorIds: string[],
  ): Promise<void> {
    try {
      await awsDynamoService.updateItem(
        COLLECTION_NAME,
        { zoneId: zoneId },
        {
          assignedInspectors: inspectorIds,
          updatedAt: new Date().toISOString(),
        },
      );
      console.log(
        `✅ Assigned ${inspectorIds.length} inspectors to zone ${zoneId}`,
      );
    } catch (error) {
      console.error("Error assigning inspectors to zone:", error);
      throw new Error("Failed to assign inspectors");
    }
  }

  /**
   * Get zones by municipal council
   */
  async getZonesByCouncil(municipalCouncil: string): Promise<ParkingZone[]> {
    try {
      const allZones = await this.getAllParkingZones();
      return allZones.filter(
        (zone) => zone.municipalCouncil === municipalCouncil,
      );
    } catch (error) {
      console.error("Error getting zones by council:", error);
      throw new Error("Failed to fetch zones by council");
    }
  }
}

export default new ParkingZoneService();
