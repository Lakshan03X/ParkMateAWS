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
  status: "active" | "inactive";
  inactiveReason?: string;
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION_NAME = "parkingZones";

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
        status: data.status || "active",
        inactiveReason: data.inactiveReason,
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
      const result = await awsDynamoService.getItem(COLLECTION_NAME, { id: zoneId });

      if (result.item) {
        const data = result.item;
        return {
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
    zoneData: Omit<ParkingZone, "id">
  ): Promise<ParkingZone> {
    try {
      const id = `ZONE_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const newZone = {
        id,
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
    updates: Partial<ParkingZone>
  ): Promise<void> {
    try {
      await awsDynamoService.updateItem(
        COLLECTION_NAME,
        { id: zoneId },
        {
          ...updates,
          updatedAt: new Date().toISOString(),
        }
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
      await awsDynamoService.deleteItem(COLLECTION_NAME, { id: zoneId });
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
    inactiveReason?: string
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

      await awsDynamoService.updateItem(COLLECTION_NAME, { id: zoneId }, updateData);
    } catch (error) {
      console.error("Error updating zone status:", error);
      throw new Error("Failed to update zone status");
    }
  }

  /**
   * Get parking zones by status
   */
  async getParkingZonesByStatus(
    status: "active" | "inactive"
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
    municipalCouncil: string
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
}

export default new ParkingZoneService();
