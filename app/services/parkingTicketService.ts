import awsDynamoService from "./awsDynamoService";
import parkingZoneService from "./parkingZoneService";

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
  parkingSection?: string;
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
  private FINES_COLLECTION = "parkmate-fines";
  private TICKETS_COLLECTION = "parkmate-parking-tickets";
  private RECEIPTS_COLLECTION = "parkmate-receipts";
  private ZONES_COLLECTION = "parkmate-parking-zones";

  /**
   * Get active parking ticket for a vehicle
   */
  async getActiveTicketByVehicleNumber(
    vehicleNumber: string,
  ): Promise<ParkingTicket | null> {
    try {
      // Fetch all tickets and filter in memory since we can't do complex querying with scan easily
      const result = await awsDynamoService.scan(this.TICKETS_COLLECTION);
      const allTickets = result.items || [];

      const activeTicket = allTickets.find(
        (ticket: any) =>
          ticket.vehicleNumber === vehicleNumber.toUpperCase() &&
          ticket.isActive === true &&
          ticket.isCancelled === false,
      );

      if (!activeTicket) {
        return null;
      }

      // Calculate time remaining
      const endTime = new Date(activeTicket.endTime);
      const now = new Date();
      const timeRemaining = Math.max(
        0,
        Math.floor((endTime.getTime() - now.getTime()) / 1000),
      );

      // Check if ticket has expired
      if (timeRemaining <= 0) {
        // Mark ticket as inactive
        await awsDynamoService.updateItem(
          this.TICKETS_COLLECTION,
          { ticketId: activeTicket.ticketId },
          {
            isActive: false,
            updatedAt: new Date().toISOString(),
          },
        );
        return null;
      }

      return {
        id: activeTicket.id,
        ...activeTicket,
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
      const result = await awsDynamoService.scan(this.FINES_COLLECTION);
      const allFines = result.items || [];

      // Filter fines for vehicle
      const vehicleFines = allFines.filter(
        (fine: any) =>
          fine.vehicleNumber === vehicleNumber.toUpperCase() && !fine.isPaid,
      );

      if (vehicleFines.length === 0) {
        return null;
      }

      // Return the most recent unpaid fine (sort by createdAt)
      vehicleFines.sort((a: any, b: any) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return bTime - aTime;
      });

      return vehicleFines[0] as Fine;
    } catch (error) {
      console.error("Error checking outstanding fines:", error);
      throw new Error("Failed to check outstanding fines");
    }
  }

  /**
   * Get parking zone rate from AWS DynamoDB
   */
  private async getParkingZoneRate(parkingZone: string): Promise<number> {
    try {
      const result = await awsDynamoService.scan(this.ZONES_COLLECTION);
      const allZones = result.items || [];

      // Extract location from formatted string (e.g., "Zone A - Location Name")
      let locationToSearch = parkingZone;
      if (parkingZone.includes(" - ")) {
        locationToSearch = parkingZone.split(" - ")[1].trim();
      }

      // Try to find by location
      let foundZone = allZones.find(
        (zone: any) => zone.location === locationToSearch,
      );

      // If not found by location, try by zone code
      if (!foundZone && parkingZone.includes(" - ")) {
        const zoneCode = parkingZone.split(" - ")[0].trim();
        foundZone = allZones.find((zone: any) => zone.zoneCode === zoneCode);
      }

      if (foundZone) {
        // Parse the parking rate string (e.g., "Rs. 150 per hour" or "150")
        const rateString = foundZone.parkingRate;
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
    duration: string,
    parkingSection?: string,
  ): Promise<ParkingTicket> {
    try {
      const id = `TICKET_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      const ticketId = `CBC${Math.floor(1000 + Math.random() * 9000)}`;
      const startTime = new Date();
      const durationMinutes = this.parseDuration(duration);
      const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

      // Get the actual parking rate from AWS DynamoDB
      const zoneRate = await this.getParkingZoneRate(parkingZone);
      const parkingFee = this.calculateParkingFeeWithRate(duration, zoneRate);

      console.log(
        `🎫 Creating ticket: Zone=${parkingZone}, Section=${parkingSection || "None"}, Duration=${duration}, Fee=Rs.${parkingFee}`,
      );

      const ticketData = {
        id,
        vehicleNumber: vehicleNumber.toUpperCase(),
        ticketId,
        parkingZone,
        parkingSection: parkingSection || "",
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await awsDynamoService.putItem(this.TICKETS_COLLECTION, ticketData);

      // Decrease available spots in the parking zone
      await parkingZoneService.decreaseAvailableSpots(parkingZone);

      return ticketData as ParkingTicket;
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
      // Find by ticketId field (not doc id)
      const result = await awsDynamoService.scan(this.TICKETS_COLLECTION);
      const allTickets = result.items || [];

      const ticket = allTickets.find((t: any) => t.ticketId === ticketId);

      if (ticket) {
        return ticket as ParkingTicket;
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
    canCancel: boolean,
  ): Promise<void> {
    try {
      const ticket = await this.getTicketById(ticketId);

      if (ticket) {
        await awsDynamoService.updateItem(
          this.TICKETS_COLLECTION,
          { ticketId: ticket.ticketId },
          {
            canCancel,
            updatedAt: new Date().toISOString(),
          },
        );
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
    additionalDuration: string,
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
        zoneRate,
      );
      const newEndTime = new Date(
        new Date(ticket.endTime).getTime() + additionalMinutes * 60000,
      );

      await awsDynamoService.updateItem(
        this.TICKETS_COLLECTION,
        { ticketId: ticket.ticketId },
        {
          endTime: newEndTime.toISOString(),
          parkingFee: ticket.parkingFee + additionalFee,
          timeRemaining: ticket.timeRemaining + additionalMinutes * 60,
          parkingRate: zoneRate, // Update the rate
          updatedAt: new Date().toISOString(),
        },
      );

      return {
        ...ticket,
        endTime: newEndTime.toISOString(),
        parkingFee: ticket.parkingFee + additionalFee,
        timeRemaining: ticket.timeRemaining + additionalMinutes * 60,
      };
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
      const ticket = await this.getTicketById(ticketId);

      if (ticket) {
        await awsDynamoService.updateItem(
          this.TICKETS_COLLECTION,
          { ticketId: ticket.ticketId },
          {
            isCancelled: true,
            isActive: false,
            cancelledAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        );

        // Increase available spots in the parking zone
        await parkingZoneService.increaseAvailableSpots(ticket.parkingZone);

        // Remove all associated fines
        const result = await awsDynamoService.scan(this.FINES_COLLECTION);
        const allFines = result.items || [];
        const relatedFines = allFines.filter(
          (f: any) => f.ticketId === ticketId,
        );

        for (const fine of relatedFines) {
          await awsDynamoService.deleteItem(this.FINES_COLLECTION, {
            fineId: fine.fineId,
          });
        }
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
      const result = await awsDynamoService.getItem(this.FINES_COLLECTION, {
        fineId: fineId,
      });

      if (!result.item) {
        throw new Error("Fine not found");
      }

      const fineData = result.item as Fine;

      await awsDynamoService.updateItem(
        this.FINES_COLLECTION,
        { fineId: fineId },
        {
          isPaid: true,
          paidAt: new Date().toISOString(),
          paymentId,
        },
      );

      // Create receipt
      const receiptId = `RECEIPT_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      const receiptData = {
        receiptId: receiptId,
        ticketId: fineData.ticketId,
        vehicleNumber: fineData.vehicleNumber,
        amount: fineData.fineAmount,
        paymentMethod: "Stripe",
        paymentId,
        transactionDate: new Date().toISOString(),
        type: "fine",
        createdAt: new Date().toISOString(),
      };

      await awsDynamoService.putItem(this.RECEIPTS_COLLECTION, receiptData);

      return receiptData;
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
    paymentId: string,
  ): Promise<PaymentReceipt> {
    try {
      const ticket = await this.getTicketById(ticketId);
      if (!ticket) throw new Error("Ticket not found");

      await awsDynamoService.updateItem(
        this.TICKETS_COLLECTION,
        { ticketId: ticket.ticketId }, // Use ticketId as the primary key
        {
          isPaid: true,
          isActive: false,
          paidAt: new Date().toISOString(),
          paymentId,
          updatedAt: new Date().toISOString(),
        },
      );

      // Increase available spots in the parking zone
      await parkingZoneService.increaseAvailableSpots(ticket.parkingZone);

      // Create receipt
      const receiptId = `RECEIPT_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      const receiptData = {
        receiptId: receiptId,
        ticketId: ticket.ticketId,
        vehicleNumber: ticket.vehicleNumber,
        amount: ticket.parkingFee,
        paymentMethod: "Stripe",
        paymentId,
        transactionDate: new Date().toISOString(),
        type: "parking",
        createdAt: new Date().toISOString(),
      };

      await awsDynamoService.putItem(this.RECEIPTS_COLLECTION, receiptData);

      return receiptData;
    } catch (error) {
      console.error("Error processing ticket payment:", error);
      throw new Error("Failed to process ticket payment");
    }
  }

  /**
   * Parse duration string to minutes
   */
  private parseDuration(duration: string): number {
    // Handle undefined or empty duration
    if (!duration || typeof duration !== "string") {
      console.warn("Invalid duration provided, using default 30 minutes");
      return 30;
    }

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
    ratePerHour: number,
  ): number {
    const minutes = this.parseDuration(duration);
    const hours = minutes / 60; // Use exact hours, not rounded
    const fee = hours * ratePerHour;

    console.log(
      `💰 Fee Calculation: ${duration} (${minutes} mins) × Rs.${ratePerHour}/hr = Rs.${fee.toFixed(2)} → Rs.${Math.round(fee)}`,
    );

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
      const id = `FINE_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      const fineData = {
        id,
        fineId: id, // Add fineId for DynamoDB primary key
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await awsDynamoService.putItem(this.FINES_COLLECTION, fineData);
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
      const result = await awsDynamoService.scan(this.FINES_COLLECTION);
      const allFines = result.items || [];

      return allFines.filter((f: any) => !f.isPaid) as Fine[];
    } catch (error) {
      console.error("Error fetching unpaid fines:", error);
      throw new Error("Failed to fetch unpaid fines");
    }
  }

  /**
   * Get all fines (both paid and unpaid)
   */
  async getAllFines(): Promise<Fine[]> {
    try {
      const result = await awsDynamoService.scan(this.FINES_COLLECTION);
      return (result.items || []) as Fine[];
    } catch (error) {
      console.error("Error fetching all fines:", error);
      throw new Error("Failed to fetch all fines");
    }
  }

  /**
   * Get fines for a specific user by userId
   */
  async getFinesByUserId(userId: string): Promise<Fine[]> {
    try {
      const result = await awsDynamoService.scan(this.FINES_COLLECTION);
      const allFines = (result.items || []) as Fine[];

      // Filter fines that belong to this user
      // Assuming fines have userId field linking to parkmate-users
      const userFines = allFines.filter(
        (fine: any) => fine.userId === userId || fine.ownerId === userId,
      );

      console.log(`📋 Found ${userFines.length} fines for user ${userId}`);
      return userFines;
    } catch (error) {
      console.error("Error fetching user fines:", error);
      throw new Error("Failed to fetch user fines");
    }
  }

  /**
   * Get all parking tickets
   */
  async getAllTickets(): Promise<ParkingTicket[]> {
    try {
      const result = await awsDynamoService.scan(this.TICKETS_COLLECTION);
      const tickets = (result.items || []).map((data: any) => {
        return {
          id: data.id,
          vehicleNumber: (data.vehicleNumber as string) || "",
          ticketId: (data.ticketId as string) || "",
          parkingZone: (data.parkingZone as string) || "",
          parkingSection: data.parkingSection as string | undefined,
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
      const fineId = `FINE_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      const currentDate = new Date();
      const fineData = {
        id: fineId,
        fineId: fineId, // Add fineId for DynamoDB primary key
        vehicleNumber: ticket.vehicleNumber,
        ticketId: ticket.ticketId,
        entryTime: new Date(ticket.startTime).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        exitTime: new Date(ticket.endTime).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        duration: ticket.duration,
        actualArrival: currentDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        fineDuration: "Unpaid",
        fineDate: currentDate.toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        reason: "Pay Later - Unpaid Parking Fee",
        location: ticket.parkingZone,
        fineAmount: ticket.parkingFee,
        isPaid: false,
        createdAt: currentDate.toISOString(),
        updatedAt: currentDate.toISOString(),
      };

      // Add fine to AWS DynamoDB
      await awsDynamoService.putItem(this.FINES_COLLECTION, fineData);

      // Mark ticket as inactive and link to fine
      await awsDynamoService.updateItem(
        this.TICKETS_COLLECTION,
        { ticketId: ticket.ticketId },
        {
          isActive: false,
          convertedToFine: true,
          fineId: fineId,
          updatedAt: new Date().toISOString(),
        },
      );

      return fineData as Fine;
    } catch (error) {
      console.error("Error converting ticket to fine:", error);
      throw new Error("Failed to convert ticket to fine");
    }
  }
}

export default new ParkingTicketService();
