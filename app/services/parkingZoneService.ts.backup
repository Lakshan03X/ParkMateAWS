import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

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
      const zonesRef = collection(db, COLLECTION_NAME);
      const q = query(zonesRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const zones: ParkingZone[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        zones.push({
          id: doc.id,
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
      const zoneRef = doc(db, COLLECTION_NAME, zoneId);
      const zoneSnap = await getDoc(zoneRef);

      if (zoneSnap.exists()) {
        const data = zoneSnap.data();
        return {
          id: zoneSnap.id,
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
      const newZone = {
        ...zoneData,
        status: zoneData.status || "active",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), newZone);

      return {
        id: docRef.id,
        ...zoneData,
      };
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
      const zoneRef = doc(db, COLLECTION_NAME, zoneId);
      await updateDoc(zoneRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
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
      const zoneRef = doc(db, COLLECTION_NAME, zoneId);
      await deleteDoc(zoneRef);
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
      const zoneRef = doc(db, COLLECTION_NAME, zoneId);
      const updateData: any = {
        status: status,
        updatedAt: Timestamp.now(),
      };

      if (status === "inactive" && inactiveReason) {
        updateData.inactiveReason = inactiveReason;
      } else if (status === "active") {
        updateData.inactiveReason = "";
      }

      await updateDoc(zoneRef, updateData);
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
      const zonesRef = collection(db, COLLECTION_NAME);
      // Fetch all zones without orderBy to avoid composite index requirement
      const q = query(zonesRef, where("status", "==", status));
      const querySnapshot = await getDocs(q);

      const zones: ParkingZone[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        zones.push({
          id: doc.id,
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
      });

      // Sort by createdAt locally
      zones.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.seconds - a.createdAt.seconds;
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
      const zonesRef = collection(db, COLLECTION_NAME);
      const querySnapshot = await getDocs(zonesRef);

      const zones: ParkingZone[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const zone = {
          id: doc.id,
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
      const zonesRef = collection(db, COLLECTION_NAME);
      const q = query(
        zonesRef,
        where("municipalCouncil", "==", municipalCouncil),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);

      const zones: ParkingZone[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        zones.push({
          id: doc.id,
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
      });

      return zones;
    } catch (error) {
      console.error("Error getting zones by municipal council:", error);
      throw new Error("Failed to fetch zones by municipal council");
    }
  }
}

export default new ParkingZoneService();
