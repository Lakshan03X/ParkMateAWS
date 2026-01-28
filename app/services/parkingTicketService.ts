import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Fine {
  id: string;
  vehicleNumber: string;
  ticketId: string;
  entryTime: string;
  exitTime: string;
  duration: string;
  actualArrival: string;
  fineDuration: string;
  fineDate: string;
  reason: string;
  location: string;
  fineAmount: number;
  isPaid: boolean;
  paidAt?: string;
  paymentId?: string;
  createdAt?: any;
}

export interface ParkingTicket {
  id: string;
  vehicleNumber: string;
  ticketId: string;
  parkingZone: string;
  startTime: string;
  endTime: string;
  duration: string;
  parkingFee: number;
  timeRemaining: number; // in seconds
  isPaid: boolean;
  isCancelled: boolean;
  isActive: boolean;
  canCancel: boolean;
  convertedToFine?: boolean;
  fineId?: string;
  paidAt?: string;
  cancelledAt?: string;
  paymentId?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface PaymentReceipt {
  id: string;
  ticketId: string;
  vehicleNumber: string;
  amount: number;
  paymentMethod: string;
  paymentId: string;
  transactionDate: string;
  receiptUrl?: string;
}

class ParkingTicketService {
  private FINES_COLLECTION = "fines";
  private TICKETS_COLLECTION = "parkingTickets";
  private RECEIPTS_COLLECTION = "paymentReceipts";
  private ZONES_COLLECTION = "parkingZones";

  /**
   * Get active parking ticket for a vehicle
   */
  async getActiveTicketByVehicleNumber(
    vehicleNumber: string
  ): Promise<ParkingTicket | null> {
    try {
      const ticketsRef = collection(db, this.TICKETS_COLLECTION);
      const q = query(
        ticketsRef,
        where("vehicleNumber", "==", vehicleNumber.toUpperCase()),
        where("isActive", "==", true),
        where("isCancelled", "==", false)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      // Get the first active ticket
      const ticketDoc = querySnapshot.docs[0];
      const ticketData = ticketDoc.data();

      // Calculate time remaining
      const endTime = new Date(ticketData.endTime);
      const now = new Date();
      const timeRemaining = Math.max(
        0,
        Math.floor((endTime.getTime() - now.getTime()) / 1000)
      );

      // Check if ticket has expired
      if (timeRemaining <= 0) {
        // Mark ticket as inactive
        await updateDoc(doc(db, this.TICKETS_COLLECTION, ticketDoc.id), {
          isActive: false,
          updatedAt: Timestamp.now(),
        });
        return null;
      }

      return {
        id: ticketDoc.id,
        ...ticketData,
        timeRemaining,
      } as ParkingTicket;
    } catch (error) {
      console.error("Error getting active ticket:", error);
      throw new Error("Failed to get active ticket");
    }
  }

  /**
   * Check if vehicle has outstanding fines
   */
  async checkOutstandingFines(vehicleNumber: string): Promise<Fine | null> {
    try {
      const finesRef = collection(db, this.FINES_COLLECTION);

      // Simple query without orderBy to avoid index requirement
      const q = query(
        finesRef,
        where("vehicleNumber", "==", vehicleNumber.toUpperCase())
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      // Filter unpaid fines in memory
      const unpaidFines = querySnapshot.docs
        .map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Fine)
        )
        .filter((fine) => !fine.isPaid);

      if (unpaidFines.length === 0) {
        return null;
      }

      // Return the most recent unpaid fine (sort by createdAt in memory)
      const sortedFines = unpaidFines.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      return sortedFines[0];
    } catch (error) {
      console.error("Error checking outstanding fines:", error);
      throw new Error("Failed to check outstanding fines");
    }
  }

  /**
   * Get parking zone rate from Firebase
   */
  private async getParkingZoneRate(parkingZone: string): Promise<number> {
    try {
      const zonesRef = collection(db, this.ZONES_COLLECTION);

      // Extract location from formatted string (e.g., "Zone A - Location Name")
      let locationToSearch = parkingZone;
      if (parkingZone.includes(" - ")) {
        // If it's formatted as "Zone A - Location Name", extract the location part
        locationToSearch = parkingZone.split(" - ")[1].trim();
      }

      // Try to find by location
      let q = query(zonesRef, where("location", "==", locationToSearch));
      let querySnapshot = await getDocs(q);

      // If not found by location, try by zone code
      if (querySnapshot.empty && parkingZone.includes(" - ")) {
        const zoneCode = parkingZone.split(" - ")[0].trim();
        q = query(zonesRef, where("zoneCode", "==", zoneCode));
        querySnapshot = await getDocs(q);
      }

      if (!querySnapshot.empty) {
        const zoneData = querySnapshot.docs[0].data();
        // Parse the parking rate string (e.g., "Rs. 150 per hour" or "150")
        const rateString = zoneData.parkingRate;
        const rateMatch = rateString.match(/(\d+)/);
        if (rateMatch) {
          const rate = parseInt(rateMatch[1]);
          console.log(`Found parking rate for ${parkingZone}: Rs. ${rate}`);
          return rate;
        }
      }

      console.log(`Parking zone not found: ${parkingZone}, using default rate`);
      // Default rate if zone not found
      return 100; // Rs. 100 per hour
    } catch (error) {
      console.error("Error getting parking zone rate:", error);
      return 100; // Default fallback rate
    }
  }

  /**
   * Create a new parking ticket
   */
  async createParkingTicket(
    vehicleNumber: string,
    parkingZone: string,
    duration: string
  ): Promise<ParkingTicket> {
    try {
      const ticketId = `CBC${Math.floor(1000 + Math.random() * 9000)}`;
      const startTime = new Date();
      const durationMinutes = this.parseDuration(duration);
      const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

      // Get the actual parking rate from Firebase
      const zoneRate = await this.getParkingZoneRate(parkingZone);
      const parkingFee = this.calculateParkingFeeWithRate(duration, zoneRate);

      const ticketData = {
        vehicleNumber: vehicleNumber.toUpperCase(),
        ticketId,
        parkingZone,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        parkingFee,
        parkingRate: zoneRate, // Store the rate for future calculations
        timeRemaining: durationMinutes * 60, // in seconds
        isPaid: false,
        isCancelled: false,
        isActive: true,
        canCancel: false, // disabled for first 10 minutes
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(
        collection(db, this.TICKETS_COLLECTION),
        ticketData
      );

      return {
        id: docRef.id,
        ...ticketData,
      };
    } catch (error) {
      console.error("Error creating parking ticket:", error);
      throw new Error("Failed to create parking ticket");
    }
  }

  /**
   * Get parking ticket by ID
   */
  async getTicketById(ticketId: string): Promise<ParkingTicket | null> {
    try {
      const ticketsRef = collection(db, this.TICKETS_COLLECTION);
      const q = query(ticketsRef, where("ticketId", "==", ticketId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data(),
        } as ParkingTicket;
      }

      return null;
    } catch (error) {
      console.error("Error getting ticket:", error);
      throw new Error("Failed to get ticket");
    }
  }

  /**
   * Update ticket - enable cancel after 10 minutes
   */
  async updateTicketCancelStatus(
    ticketId: string,
    canCancel: boolean
  ): Promise<void> {
    try {
      const ticketsRef = collection(db, this.TICKETS_COLLECTION);
      const q = query(ticketsRef, where("ticketId", "==", ticketId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docRef = doc(
          db,
          this.TICKETS_COLLECTION,
          querySnapshot.docs[0].id
        );
        await updateDoc(docRef, {
          canCancel,
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error("Error updating cancel status:", error);
      throw new Error("Failed to update cancel status");
    }
  }

  /**
   * Extend parking time
   */
  async extendParkingTime(
    ticketId: string,
    additionalDuration: string
  ): Promise<ParkingTicket> {
    try {
      const ticket = await this.getTicketById(ticketId);
      if (!ticket) throw new Error("Ticket not found");

      const additionalMinutes = this.parseDuration(additionalDuration);

      // Get the parking rate (either from ticket or fetch from zone)
      let zoneRate = (ticket as any).parkingRate;
      if (!zoneRate) {
        zoneRate = await this.getParkingZoneRate(ticket.parkingZone);
      }

      // Calculate additional fee based on the zone's rate
      const additionalFee = this.calculateParkingFeeWithRate(
        additionalDuration,
        zoneRate
      );
      const newEndTime = new Date(
        new Date(ticket.endTime).getTime() + additionalMinutes * 60000
      );

      const ticketsRef = collection(db, this.TICKETS_COLLECTION);
      const q = query(ticketsRef, where("ticketId", "==", ticketId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docRef = doc(
          db,
          this.TICKETS_COLLECTION,
          querySnapshot.docs[0].id
        );
        await updateDoc(docRef, {
          endTime: newEndTime.toISOString(),
          parkingFee: ticket.parkingFee + additionalFee,
          timeRemaining: ticket.timeRemaining + additionalMinutes * 60,
          parkingRate: zoneRate, // Update the rate
          updatedAt: Timestamp.now(),
        });

        return {
          ...ticket,
          endTime: newEndTime.toISOString(),
          parkingFee: ticket.parkingFee + additionalFee,
          timeRemaining: ticket.timeRemaining + additionalMinutes * 60,
        };
      }

      throw new Error("Failed to extend parking time");
    } catch (error) {
      console.error("Error extending parking time:", error);
      throw new Error("Failed to extend parking time");
    }
  }

  /**
   * Cancel parking ticket
   */
  async cancelTicket(ticketId: string): Promise<void> {
    try {
      const ticketsRef = collection(db, this.TICKETS_COLLECTION);
      const q = query(ticketsRef, where("ticketId", "==", ticketId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docRef = doc(
          db,
          this.TICKETS_COLLECTION,
          querySnapshot.docs[0].id
        );
        await updateDoc(docRef, {
          isCancelled: true,
          isActive: false,
          cancelledAt: new Date().toISOString(),
          updatedAt: Timestamp.now(),
        });

        // Remove all associated fines (both paid and unpaid)
        const finesRef = collection(db, this.FINES_COLLECTION);
        const fineQuery = query(
          finesRef,
          where("ticketId", "==", ticketId)
        );
        const fineSnapshot = await getDocs(fineQuery);

        // Delete all fines associated with this ticket
        const deletePromises = fineSnapshot.docs.map((fineDoc) =>
          deleteDoc(doc(db, this.FINES_COLLECTION, fineDoc.id))
        );
        await Promise.all(deletePromises);
      }
    } catch (error) {
      console.error("Error cancelling ticket:", error);
      throw new Error("Failed to cancel ticket");
    }
  }

  /**
   * Process payment for fine
   */
  async payFine(fineId: string, paymentId: string): Promise<PaymentReceipt> {
    try {
      const fineRef = doc(db, this.FINES_COLLECTION, fineId);
      const fineDoc = await getDoc(fineRef);

      if (!fineDoc.exists()) {
        throw new Error("Fine not found");
      }

      const fineData = fineDoc.data() as Fine;

      await updateDoc(fineRef, {
        isPaid: true,
        paidAt: new Date().toISOString(),
        paymentId,
      });

      // Create receipt
      const receiptData = {
        ticketId: fineData.ticketId,
        vehicleNumber: fineData.vehicleNumber,
        amount: fineData.fineAmount,
        paymentMethod: "Stripe",
        paymentId,
        transactionDate: new Date().toISOString(),
        type: "fine",
        createdAt: Timestamp.now(),
      };

      const receiptRef = await addDoc(
        collection(db, this.RECEIPTS_COLLECTION),
        receiptData
      );

      return {
        id: receiptRef.id,
        ...receiptData,
      };
    } catch (error) {
      console.error("Error processing fine payment:", error);
      throw new Error("Failed to process fine payment");
    }
  }

  /**
   * Process payment for parking ticket
   */
  async payTicket(
    ticketId: string,
    paymentId: string
  ): Promise<PaymentReceipt> {
    try {
      const ticket = await this.getTicketById(ticketId);
      if (!ticket) throw new Error("Ticket not found");

      const ticketsRef = collection(db, this.TICKETS_COLLECTION);
      const q = query(ticketsRef, where("ticketId", "==", ticketId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docRef = doc(
          db,
          this.TICKETS_COLLECTION,
          querySnapshot.docs[0].id
        );
        await updateDoc(docRef, {
          isPaid: true,
          isActive: false,
          paidAt: new Date().toISOString(),
          paymentId,
          updatedAt: Timestamp.now(),
        });
      }

      // Create receipt
      const receiptData = {
        ticketId: ticket.ticketId,
        vehicleNumber: ticket.vehicleNumber,
        amount: ticket.parkingFee,
        paymentMethod: "Stripe",
        paymentId,
        transactionDate: new Date().toISOString(),
        type: "parking",
        createdAt: Timestamp.now(),
      };

      const receiptRef = await addDoc(
        collection(db, this.RECEIPTS_COLLECTION),
        receiptData
      );

      return {
        id: receiptRef.id,
        ...receiptData,
      };
    } catch (error) {
      console.error("Error processing ticket payment:", error);
      throw new Error("Failed to process ticket payment");
    }
  }

  /**
   * Parse duration string to minutes
   */
  private parseDuration(duration: string): number {
    // Handle formats like "30 minutes", "1 hour", "1 hour 30 minutes", "2 hours 30 minutes"
    let totalMinutes = 0;

    // Extract hours
    const hourMatch = duration.match(/(\d+)\s*hour/i);
    if (hourMatch) {
      totalMinutes += parseInt(hourMatch[1]) * 60;
    }

    // Extract minutes (but not if they're part of hours)
    const minuteMatch = duration.match(/(\d+)\s*minute/i);
    if (minuteMatch) {
      totalMinutes += parseInt(minuteMatch[1]);
    }

    // If no match found, return default
    return totalMinutes || 30;
  }

  /**
   * Calculate parking fee based on duration and rate (proportional calculation)
   */
  private calculateParkingFeeWithRate(
    duration: string,
    ratePerHour: number
  ): number {
    const minutes = this.parseDuration(duration);
    const hours = minutes / 60; // Use exact hours, not rounded
    const fee = hours * ratePerHour;

    // Round to nearest integer (or you can use Math.ceil to round up)
    return Math.round(fee);
  }

  /**
   * Calculate parking fee based on duration (fallback method)
   */
  private calculateParkingFee(duration: string): number {
    return this.calculateParkingFeeWithRate(duration, 100);
  }

  /**
   * Initialize sample fine data for testing
   */
  async initializeSampleFine(vehicleNumber: string): Promise<void> {
    try {
      const fineData = {
        vehicleNumber: vehicleNumber.toUpperCase(),
        ticketId: `AT${Math.floor(1000000 + Math.random() * 9000000)}`,
        entryTime: "9:41 AM",
        exitTime: "11:41 AM",
        duration: "1 Hour 30 Mins",
        actualArrival: "2 Hour 30 Mins",
        fineDuration: "1 Hour",
        fineDate: "05 Oct 2025",
        reason: "Exceeded time limit",
        location: "Temple Road, Maharagama",
        fineAmount: 1000,
        isPaid: false,
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, this.FINES_COLLECTION), fineData);
      console.log("Sample fine created successfully");
    } catch (error) {
      console.error("Error creating sample fine:", error);
    }
  }

  /**
   * Get unpaid fines
   */
  async getUnpaidFines(): Promise<Fine[]> {
    try {
      const finesRef = collection(db, this.FINES_COLLECTION);
      const q = query(finesRef, where("isPaid", "==", false));
      const querySnapshot = await getDocs(q);

      const fines: Fine[] = querySnapshot.docs.map(
        (d) =>
          ({
            id: d.id,
            ...(d.data() as any),
          } as Fine)
      );

      return fines;
    } catch (error) {
      console.error("Error fetching unpaid fines:", error);
      throw new Error("Failed to fetch unpaid fines");
    }
  }

  /**
   * Get all parking tickets
   */
  async getAllTickets(): Promise<ParkingTicket[]> {
    try {
      const ticketsRef = collection(db, this.TICKETS_COLLECTION);
      const querySnapshot = await getDocs(ticketsRef);

      const tickets: ParkingTicket[] = querySnapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          vehicleNumber: (data.vehicleNumber as string) || "",
          ticketId: (data.ticketId as string) || "",
          parkingZone: (data.parkingZone as string) || "",
          startTime: (data.startTime as string) || "",
          endTime: (data.endTime as string) || "",
          duration: (data.duration as string) || "",
          parkingFee: (data.parkingFee as number) || 0,
          timeRemaining: (data.timeRemaining as number) || 0,
          isPaid: Boolean(data.isPaid),
          isCancelled: Boolean(data.isCancelled),
          isActive: Boolean(data.isActive),
          canCancel: Boolean(data.canCancel),
          paymentMethod: data.paymentMethod as string | undefined,
          paidAt: data.paidAt as string | undefined,
          cancelledAt: data.cancelledAt as string | undefined,
          paymentId: data.paymentId as string | undefined,
          receiptUrl: data.receiptUrl as string | undefined,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        } as ParkingTicket;
      });

      return tickets;
    } catch (error) {
      console.error("Error fetching parking tickets:", error);
      throw new Error("Failed to fetch parking tickets");
    }
  }

  /**
   * Convert a parking ticket to a fine (for Pay Later functionality)
   */
  async convertTicketToFine(ticketId: string): Promise<Fine> {
    try {
      // Get the ticket
      const ticket = await this.getTicketById(ticketId);
      if (!ticket) throw new Error("Ticket not found");

      // Create a fine from the ticket
      const fineData = {
        vehicleNumber: ticket.vehicleNumber,
        ticketId: ticket.ticketId,
        entryTime: ticket.startTime,
        exitTime: ticket.endTime,
        duration: ticket.duration,
        actualArrival: new Date().toISOString(),
        fineDuration: "0 minutes",
        fineDate: new Date().toISOString().split("T")[0],
        reason: "Pay Later - Unpaid Parking Fee",
        location: ticket.parkingZone,
        fineAmount: ticket.parkingFee,
        isPaid: false,
        createdAt: Timestamp.now(),
      };

      // Add fine to Firebase
      const fineRef = await addDoc(
        collection(db, this.FINES_COLLECTION),
        fineData
      );

      // Mark ticket as inactive and link to fine
      const ticketsRef = collection(db, this.TICKETS_COLLECTION);
      const q = query(ticketsRef, where("ticketId", "==", ticketId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docRef = doc(
          db,
          this.TICKETS_COLLECTION,
          querySnapshot.docs[0].id
        );
        await updateDoc(docRef, {
          isActive: false,
          convertedToFine: true,
          fineId: fineRef.id,
          updatedAt: Timestamp.now(),
        });
      }

      return {
        id: fineRef.id,
        ...fineData,
      } as Fine;
    } catch (error) {
      console.error("Error converting ticket to fine:", error);
      throw new Error("Failed to convert ticket to fine");
    }
  }
}

export default new ParkingTicketService();
