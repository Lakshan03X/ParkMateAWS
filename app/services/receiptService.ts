import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import { captureRef } from "react-native-view-shot";
import { Alert, Platform } from "react-native";

export interface ReceiptData {
  receiptId: string;
  ticketId: string;
  vehicleNumber: string;
  amount: number;
  paymentMethod: string;
  paymentId: string;
  transactionDate: string;
  type: "fine" | "parking";
  parkingZone?: string;
  duration?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  reason?: string;
}

class ReceiptService {
  /**
   * Generate and save receipt as image
   */
  async generateReceipt(
    receiptData: ReceiptData,
    viewRef: any
  ): Promise<string> {
    try {
      // Wait longer for the view to be fully rendered before capturing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Capture the receipt view as image
      const uri = await captureRef(viewRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
        height: undefined,
        width: undefined,
      });

      console.log("Receipt captured successfully:", uri);
      return uri;
    } catch (error) {
      console.error("Error generating receipt:", error);
      throw new Error("Failed to generate receipt");
    }
  }

  /**
   * Share receipt
   */
  async shareReceipt(fileUri: string): Promise<void> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();

      if (!isAvailable) {
        throw new Error("Sharing is not available on this device");
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: "image/png",
        dialogTitle: "Share Receipt",
      });
    } catch (error) {
      console.error("Error sharing receipt:", error);
      throw new Error("Failed to share receipt");
    }
  }

  /**
   * Download receipt (save to device)
   */
  async downloadReceipt(
    receiptData: ReceiptData,
    viewRef: any
  ): Promise<string> {
    try {
      // First, capture the receipt as image
      const uri = await this.generateReceipt(receiptData, viewRef);

      // Request media library permissions (writeOnly: true for saving images only)
      const { status } = await MediaLibrary.requestPermissionsAsync(true);

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to save receipts to your gallery.",
          [{ text: "OK" }]
        );
        throw new Error("Permission to access media library was denied");
      }

      // Save to media library (Photos/Gallery)
      const asset = await MediaLibrary.createAssetAsync(uri);

      // Create or get album
      const albumName = "ParkMate Receipts";

      try {
        const album = await MediaLibrary.getAlbumAsync(albumName);

        if (album === null) {
          await MediaLibrary.createAlbumAsync(albumName, asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
      } catch (albumError) {
        // If album operations fail, at least the asset is saved to the gallery
        console.log(
          "Album operation failed, but image is saved to gallery:",
          albumError
        );
      }

      Alert.alert("Success", "Receipt saved to gallery successfully!", [
        { text: "OK" },
      ]);

      return uri;
    } catch (error) {
      console.error("Error downloading receipt:", error);
      throw error;
    }
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return `Rs. ${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  /**
   * Format date and time
   */
  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  /**
   * Format date only
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  /**
   * Format time only
   */
  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }
}

export default new ReceiptService();
