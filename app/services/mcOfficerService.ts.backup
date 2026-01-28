import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

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

const COLLECTION_NAME = "mcOfficers";

class MCOfficerService {
  /**
   * Get all MC Officers
   */
  async getAllOfficers(): Promise<MCOfficer[]> {
    try {
      const officersRef = collection(db, COLLECTION_NAME);
      const q = query(officersRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const officers: MCOfficer[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        officers.push({
          id: doc.id,
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
        });
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
      const newOfficer = {
        ...officerData,
        status: officerData.status || "on duty",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), newOfficer);

      return {
        id: docRef.id,
        ...officerData,
      };
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
    updates: Partial<MCOfficer>
  ): Promise<void> {
    try {
      const officerRef = doc(db, COLLECTION_NAME, officerId);
      await updateDoc(officerRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
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
      const officerRef = doc(db, COLLECTION_NAME, officerId);
      await deleteDoc(officerRef);
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
      const officersRef = collection(db, COLLECTION_NAME);
      const querySnapshot = await getDocs(officersRef);

      const officers: MCOfficer[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const officer = {
          id: doc.id,
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
    status: "on duty" | "off duty"
  ): Promise<MCOfficer[]> {
    try {
      const officersRef = collection(db, COLLECTION_NAME);
      const q = query(
        officersRef,
        where("status", "==", status),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);

      const officers: MCOfficer[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        officers.push({
          id: doc.id,
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
    password: string
  ): Promise<MCOfficer | null> {
    try {
      const officersRef = collection(db, COLLECTION_NAME);
      const q = query(
        officersRef,
        where("councilId", "==", councilId),
        where("email", "==", email),
        where("password", "==", password)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();

      return {
        id: doc.id,
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
    selectedCouncil: string
  ): Promise<void> {
    try {
      const officerRef = doc(db, COLLECTION_NAME, officerId);
      await updateDoc(officerRef, {
        selectedCouncil: selectedCouncil,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error updating officer council:", error);
      throw new Error("Failed to update officer council");
    }
  }
}

export default new MCOfficerService();
