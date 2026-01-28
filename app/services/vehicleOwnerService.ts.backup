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
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";

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

const COLLECTION_NAME = "vehicleOwners";

class VehicleOwnerService {
  /**
   * Get all vehicle owners
   */
  async getAllOwners(): Promise<VehicleOwner[]> {
    try {
      const ownersRef = collection(db, COLLECTION_NAME);
      const q = query(ownersRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const owners: VehicleOwner[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        owners.push({
          id: doc.id,
          name: data.name,
          mobileNumber: data.mobileNumber,
          status: data.status || "online",
          nicNumber: data.nicNumber,
          email: data.email,
          registeredDate: data.registeredDate,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
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
      const newOwner = {
        ...ownerData,
        status: ownerData.status || "online",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), newOwner);

      return {
        id: docRef.id,
        ...ownerData,
      };
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
    updates: Partial<VehicleOwner>
  ): Promise<void> {
    try {
      const ownerRef = doc(db, COLLECTION_NAME, ownerId);
      await updateDoc(ownerRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
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
      const ownerRef = doc(db, COLLECTION_NAME, ownerId);
      await deleteDoc(ownerRef);
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
      const ownersRef = collection(db, COLLECTION_NAME);
      const querySnapshot = await getDocs(ownersRef);

      const owners: VehicleOwner[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const owner = {
          id: doc.id,
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
    status: "online" | "offline"
  ): Promise<VehicleOwner[]> {
    try {
      const ownersRef = collection(db, COLLECTION_NAME);
      const q = query(
        ownersRef,
        where("status", "==", status),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);

      const owners: VehicleOwner[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        owners.push({
          id: doc.id,
          name: data.name,
          mobileNumber: data.mobileNumber,
          status: data.status,
          nicNumber: data.nicNumber,
          email: data.email,
          registeredDate: data.registeredDate,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
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
      const ownersRef = collection(db, COLLECTION_NAME);
      const q = query(ownersRef, where("nicNumber", "==", nicNumber));
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
