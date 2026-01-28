import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PaymentModal from "../../../../components/PaymentModal";
import PaymentSelectionModal from "../../../../components/PaymentSelectionModal";
import ReceiptView from "../../../../components/ReceiptView";
import parkingTicketService, {
  Fine,
} from "../../../services/parkingTicketService";
import receiptService, { ReceiptData } from "../../../services/receiptService";

const DetectedFine = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { vehicleNumber, fineId } = params;
  const receiptRef = useRef<View>(null);

  const [fine, setFine] = useState<Fine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentSelectionModal, setShowPaymentSelectionModal] =
    useState(false);
  const [showStripeCardModal, setShowStripeCardModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [verifiedPhoneNumber, setVerifiedPhoneNumber] = useState("");

  useEffect(() => {
    loadFineDetails();
  }, []);

  const loadFineDetails = async () => {
    try {
      setIsLoading(true);

      if (!fineId) {
        await parkingTicketService.initializeSampleFine(
          vehicleNumber as string
        );
      }

      const fineData = await parkingTicketService.checkOutstandingFines(
        vehicleNumber as string
      );
      setFine(fineData);
    } catch (error) {
      console.error("Error loading fine details:", error);
      Alert.alert("Error", "Failed to load fine details");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayFine = () => {
    setShowPaymentSelectionModal(true);
  };

  const handlePaymentMethodSelected = async (
    method: "stripe" | "paypal" | "payoneer",
    phoneNumber?: string
  ) => {
    try {
      setShowPaymentSelectionModal(false);

      if (method === "stripe") {
        setVerifiedPhoneNumber(phoneNumber || "");
        setShowStripeCardModal(true);
      } else {
        setIsProcessing(true);
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const paymentId = `${method}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        await handlePaymentSuccess(paymentId, method);
      }
    } catch (error) {
      console.error("Payment error:", error);
      Alert.alert(
        "Payment Failed",
        "Failed to process payment. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStripePaymentSuccess = async (paymentId: string) => {
    await handlePaymentSuccess(paymentId, "stripe");
  };

  const handlePaymentSuccess = async (paymentId: string, method: string) => {
    try {
      setShowStripeCardModal(false);
      setIsProcessing(true);

      const receipt = await parkingTicketService.payFine(fine!.id, paymentId);

      const receiptInfo: ReceiptData = {
        receiptId: receipt.id,
        ticketId: receipt.ticketId,
        vehicleNumber: receipt.vehicleNumber,
        amount: receipt.amount,
        paymentMethod:
          method === "stripe"
            ? "Stripe Card"
            : method === "paypal"
            ? "PayPal"
            : "Payoneer",
        paymentId: receipt.paymentId,
        transactionDate: receipt.transactionDate,
        type: "fine",
        location: fine!.location,
        reason: fine!.reason,
      };

      setReceiptData(receiptInfo);
      setShowReceiptModal(true);

      Alert.alert(
        "Payment Successful",
        "Your fine has been paid successfully!"
      );
    } catch (error) {
      console.error("Payment error:", error);
      Alert.alert(
        "Payment Failed",
        "Failed to process payment. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!receiptData || !receiptRef.current) return;

    try {
      setIsProcessing(true);
      const fileUri = await receiptService.downloadReceipt(
        receiptData,
        receiptRef.current
      );

      Alert.alert(
        "Receipt Saved",
        "Your payment receipt has been saved successfully!",
        [
          {
            text: "Share",
            onPress: () => shareReceipt(fileUri),
          },
          {
            text: "Done",
            onPress: () => {
              setShowReceiptModal(false);
              router.push("/screens/parkingOwner/dashboard/ownersdashboard");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error downloading receipt:", error);
      Alert.alert("Error", "Failed to save receipt. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const shareReceipt = async (fileUri: string) => {
    try {
      await receiptService.shareReceipt(fileUri);
    } catch (error) {
      console.error("Error sharing receipt:", error);
      Alert.alert("Error", "Failed to share receipt.");
    }
  };

  const handleCancel = () => {
    router.push("/screens/parkingOwner/dashboard/ownersdashboard");
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#093F86" />
      </View>
    );
  }

  if (!fine) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#F44336" />
          <Text style={styles.errorText}>Fine details not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              router.push("/screens/parkingOwner/dashboard/ownersdashboard")
            }
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#E8F5E9" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={handleCancel}>
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Outstanding Fine</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Warning Badge */}
        <View style={styles.warningBadge}>
          <Ionicons name="warning" size={24} color="#F44336" />
          <Text style={styles.warningText}>Detected</Text>
        </View>

        {/* Vehicle Number */}
        <View style={styles.vehicleCard}>
          <Text style={styles.vehicleNumber}>{vehicleNumber}</Text>
        </View>

        {/* Fine Details */}
        <View style={styles.detailsCard}>
          <DetailRow label="Ticket ID" value={fine.ticketId} />
          <DetailRow label="Entry Time" value={fine.entryTime} />
          <DetailRow label="Exit Time" value={fine.exitTime} />
          <DetailRow label="Duration" value={fine.duration} />
          <DetailRow label="Actual Arrival" value={fine.actualArrival} />
          <DetailRow label="Fine Duration" value={fine.fineDuration} />
          <DetailRow label="Fine Date" value={fine.fineDate} />
          <DetailRow label="Reason" value={fine.reason} />
          <DetailRow label="Location" value={fine.location} />
        </View>

        {/* Fine Amount */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Fine Amount</Text>
          <Text style={styles.amountValue}>
            Rs. {fine.fineAmount.toLocaleString()}
          </Text>
        </View>

        {/* Warning Message */}
        <View style={styles.warningMessageCard}>
          <Ionicons name="alert-circle" size={20} color="#F44336" />
          <Text style={styles.warningMessageText}>
            You have unpaid fines that must be settled before you can start a
            new parking session
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={isProcessing}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
          onPress={handlePayFine}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.payButtonText}>Pay Fine Now</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Payment Selection Modal */}
      <PaymentSelectionModal
        visible={showPaymentSelectionModal}
        amount={fine?.fineAmount || 0}
        description={`Fine Payment - ${fine?.ticketId || ""}`}
        onClose={() => setShowPaymentSelectionModal(false)}
        onPaymentMethodSelected={handlePaymentMethodSelected}
      />

      {/* Stripe Card Payment Modal */}
      <PaymentModal
        visible={showStripeCardModal}
        amount={fine?.fineAmount || 0}
        description={`Fine Payment - ${
          fine?.ticketId || ""
        } | Phone: ${verifiedPhoneNumber}`}
        onClose={() => setShowStripeCardModal(false)}
        onSuccess={handleStripePaymentSuccess}
      />

      {/* Receipt Modal */}
      <Modal
        visible={showReceiptModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowReceiptModal(false);
          router.push("/screens/parkingOwner/dashboard/ownersdashboard");
        }}
      >
        <View style={styles.receiptModalOverlay}>
          <View style={styles.receiptModalContent}>
            <View style={styles.receiptScrollContainer}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View collapsable={false}>
                  {receiptData && (
                    <ReceiptView
                      ref={receiptRef}
                      receiptId={receiptData.receiptId}
                      ticketId={receiptData.ticketId}
                      vehicleNumber={receiptData.vehicleNumber}
                      amount={receiptData.amount}
                      paymentMethod={receiptData.paymentMethod}
                      paymentId={receiptData.paymentId}
                      transactionDate={receiptData.transactionDate}
                      type={receiptData.type}
                      location={receiptData.location}
                      reason={receiptData.reason}
                    />
                  )}
                </View>
              </ScrollView>
            </View>

            <View style={styles.receiptModalFooter}>
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={handleDownloadReceipt}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="download" size={20} color="#FFFFFF" />
                    <Text style={styles.downloadButtonText}>
                      Download Receipt
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => {
                  setShowReceiptModal(false);
                  router.push(
                    "/screens/parkingOwner/dashboard/ownersdashboard"
                  );
                }}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F5E9",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontFamily: "Poppins-Medium",
    color: "#F44336",
    marginTop: 20,
    marginBottom: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#E8F5E9",
  },
  backIcon: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 20,
  },
  warningText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#F44336",
  },
  vehicleCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  vehicleNumber: {
    fontSize: 32,
    fontFamily: "Poppins-Bold",
    color: "#000000",
    letterSpacing: 2,
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#000000",
    flex: 1,
    textAlign: "right",
  },
  amountCard: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  amountLabel: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#666666",
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 36,
    fontFamily: "Poppins-Bold",
    color: "#F44336",
  },
  warningMessageCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFEBEE",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  warningMessageText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#F44336",
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F44336",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  payButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  backButton: {
    backgroundColor: "#093F86",
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  receiptModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  receiptModalContent: {
    width: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  receiptScrollContainer: {
    flex: 1,
  },
  receiptModalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  downloadButtonText: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  doneButton: {
    backgroundColor: "#F44336",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  doneButtonText: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
});

export default DetectedFine;
