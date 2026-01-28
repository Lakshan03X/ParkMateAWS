import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import PaymentModal from "../../../../components/PaymentModal";
import PaymentSelectionModal from "../../../../components/PaymentSelectionModal";
import ReceiptView from "../../../../components/ReceiptView";
import parkingTicketService from "../../../services/parkingTicketService";
import receiptService, { ReceiptData } from "../../../services/receiptService";

interface Fine {
  id: string;
  ticketId: string;
  amount: number;
  isPaid: boolean;
  issuedDate: string;
  location?: string;
  vehicleNumber?: string;
}

const DetectedFines = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const receiptRef = useRef<View>(null);

  const [fines, setFines] = useState<Fine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentSelectionModal, setShowPaymentSelectionModal] =
    useState(false);
  const [showStripeCardModal, setShowStripeCardModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [verifiedPhoneNumber, setVerifiedPhoneNumber] = useState("");
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const unpaid = await parkingTicketService.getUnpaidFines();

        // Map service Fine -> local Fine shape
        const mapped = unpaid.map((f) => ({
          id: f.id,
          ticketId: f.ticketId || f.id,
          amount: (f.fineAmount as number) || 0,
          isPaid: !!f.isPaid,
          issuedDate:
            f.fineDate ||
            (f.createdAt
              ? new Date(
                  (f.createdAt as any).toDate
                    ? (f.createdAt as any).toDate()
                    : f.createdAt
                )
                  .toISOString()
                  .split("T")[0]
              : ""),
          location: f.location,
          vehicleNumber: f.vehicleNumber,
        }));

        setFines(mapped);
      } catch (err) {
        console.error("Failed to load fines", err);
        Alert.alert("Error", "Failed to load fines");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const unpaidFines = fines.filter((fine) => !fine.isPaid);
  const hasUnpaidFines = unpaidFines.length > 0;

  const handlePayFine = (fine: Fine) => {
    setSelectedFine(fine);
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

      if (!selectedFine) return;

      const receipt = await parkingTicketService.payFine(
        selectedFine.id,
        paymentId
      );

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
        location: selectedFine.location,
        reason: "Late Payment Fine",
      };

      setReceiptData(receiptInfo);
      setShowReceiptModal(true);

      // Update local state
      setFines((prevFines) =>
        prevFines.map((fine) =>
          fine.id === selectedFine.id ? { ...fine, isPaid: true } : fine
        )
      );

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
              router.push("/screens/parkingOwner/ownerDashboard");
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

  return (
    <View style={styles.container}>
      {/* Top Safe Area Background */}
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/screens/parkingOwner/ownerDashboard")}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detected Fines</Text>
          <View style={styles.headerSpacer} />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#093F86" />
            <Text style={styles.loadingText}>Loading fines...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Warning Banner */}
            {hasUnpaidFines && (
              <View style={styles.warningBanner}>
                <View style={styles.warningIconContainer}>
                  <Ionicons name="warning" size={28} color="#D32F2F" />
                </View>
                <Text style={styles.warningText}>
                  You have unpaid fines{"\n"}that must{"\n"}be settled before
                  you can{"\n"}start a new parking session.
                </Text>
              </View>
            )}

            {/* No Fines Message */}
            {fines.length === 0 && (
              <View style={styles.noFinesContainer}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={80}
                  color="#4CAF50"
                />
                <Text style={styles.noFinesTitle}>No Fines Detected</Text>
                <Text style={styles.noFinesSubtitle}>
                  You're all clear! Keep parking responsibly.
                </Text>
              </View>
            )}

            {/* Fines List */}
            {fines.length > 0 && (
              <View style={styles.finesContainer}>
                {fines.map((fine, index) => (
                  <View
                    key={fine.ticketId}
                    style={[
                      styles.fineCard,
                      fine.isPaid && styles.fineCardPaid,
                    ]}
                  >
                    <View style={styles.fineCardContent}>
                      <Text style={styles.ticketId}>
                        Ticket Id : {fine.ticketId}
                      </Text>
                      <Text style={styles.fineAmount}>
                        Fine Amount : Rs.{fine.amount.toFixed(2)}
                      </Text>
                      {fine.location && (
                        <Text style={styles.fineLocation}>
                          Location: {fine.location}
                        </Text>
                      )}
                      {fine.issuedDate && (
                        <Text style={styles.fineDate}>
                          Issued:{" "}
                          {new Date(fine.issuedDate).toLocaleDateString()}
                        </Text>
                      )}
                    </View>

                    {/* Pay/Paid Button */}
                    {fine.isPaid ? (
                      <View style={styles.paidButton}>
                        <Text style={styles.paidButtonText}>Paid</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.payButton}
                        onPress={() => handlePayFine(fine)}
                        activeOpacity={0.8}
                        disabled={isProcessing}
                      >
                        {isProcessing && selectedFine?.id === fine.id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.payButtonText}>Pay Now</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Summary Section */}
            {fines.length > 0 && (
              <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Fines:</Text>
                  <Text style={styles.summaryValue}>{fines.length}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Unpaid:</Text>
                  <Text style={[styles.summaryValue, styles.unpaidValue]}>
                    {unpaidFines.length}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Amount Due:</Text>
                  <Text style={[styles.summaryValue, styles.amountDue]}>
                    Rs.
                    {unpaidFines
                      .reduce((sum, fine) => sum + fine.amount, 0)
                      .toFixed(2)}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>

      <PaymentSelectionModal
        visible={showPaymentSelectionModal}
        amount={selectedFine?.amount || 0}
        description={`Fine Payment - ${
          selectedFine?.location || "Parking Fine"
        }`}
        onClose={() => setShowPaymentSelectionModal(false)}
        onPaymentMethodSelected={handlePaymentMethodSelected}
      />

      <PaymentModal
        visible={showStripeCardModal}
        amount={selectedFine?.amount || 0}
        description={`Fine - ${
          selectedFine?.location || ""
        } | Phone: ${verifiedPhoneNumber}`}
        onClose={() => setShowStripeCardModal(false)}
        onSuccess={handleStripePaymentSuccess}
      />

      <Modal
        visible={showReceiptModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowReceiptModal(false);
          router.push("/screens/parkingOwner/ownerDashboard");
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
                  router.push("/screens/parkingOwner/ownerDashboard");
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSafeArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#093F86",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  warningBanner: {
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  warningIconContainer: {
    alignItems: "center",
  },
  warningText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Poppins-Medium",
    color: "#D32F2F",
    lineHeight: 24,
    textAlign: "center",
  },
  noFinesContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  noFinesTitle: {
    fontSize: 22,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    marginTop: 16,
    marginBottom: 8,
  },
  noFinesSubtitle: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    textAlign: "center",
  },
  finesContainer: {
    gap: 16,
  },
  fineCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  fineCardPaid: {
    backgroundColor: "#F1F8F4",
    borderColor: "#C8E6C9",
  },
  fineCardContent: {
    marginBottom: 16,
  },
  ticketId: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#333333",
    marginBottom: 8,
  },
  fineAmount: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#333333",
    marginBottom: 6,
  },
  fineLocation: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    marginTop: 4,
  },
  fineDate: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#999999",
    marginTop: 2,
  },
  payButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignSelf: "flex-end",
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  payButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  paidButton: {
    backgroundColor: "#81C784",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignSelf: "flex-end",
  },
  paidButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  summaryContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  summaryLabel: {
    fontSize: 15,
    fontFamily: "Poppins-Medium",
    color: "#333333",
  },
  summaryValue: {
    fontSize: 15,
    fontFamily: "Poppins-SemiBold",
    color: "#093F86",
  },
  unpaidValue: {
    color: "#D32F2F",
  },
  amountDue: {
    fontSize: 18,
    color: "#D32F2F",
  },
  receiptModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  receiptModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  receiptScrollContainer: {
    maxHeight: 500,
  },
  receiptModalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#093F86",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
    marginRight: 10,
  },
  downloadButtonText: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  doneButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
  },
  doneButtonText: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
});

export default DetectedFines;
