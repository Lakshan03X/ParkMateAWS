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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PaymentModal from "../../../../components/PaymentModal";
import PaymentSelectionModal from "../../../../components/PaymentSelectionModal";
import ReceiptView from "../../../../components/ReceiptView";
import parkingTicketService, {
  ParkingTicket,
} from "../../../services/parkingTicketService";
import receiptService, { ReceiptData } from "../../../services/receiptService";

const ParkingFeeSummary = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const receiptRef = useRef<View>(null);

  const [ticket, setTicket] = useState<ParkingTicket | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [canCancel, setCanCancel] = useState(true);
  const [showExtendButton, setShowExtendButton] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendDuration, setExtendDuration] = useState("");
  const [showPaymentSelectionModal, setShowPaymentSelectionModal] =
    useState(false);
  const [showStripeCardModal, setShowStripeCardModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [verifiedPhoneNumber, setVerifiedPhoneNumber] = useState("");

  const extendDurations = [
    "30 minutes",
    "1 hour",
    "1 hour 30 minutes",
    "2 hours",
    "2 hours 30 minutes",
    "3 hours",
    "3 hours 30 minutes",
  ];

  const formatDateTime = (value: any) => {
    if (!value) return "-";
    try {
      const date =
        typeof value === "object" && typeof value.toDate === "function"
          ? value.toDate()
          : new Date(value);
      return date.toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return String(value);
    }
  };

  // Get data from params or use default values
  const vehicleNumber =
    params.vehicleNumber || (ticket?.vehicleNumber as string) || "CBC 7776";
  const ticketId =
    (params.ticketId as string) || (ticket?.ticketId as string) || "";
  const entryTime = params.entryTime || (ticket?.startTime as string) || "";
  const exitTime = params.exitTime || (ticket?.endTime as string) || "";
  const duration = params.duration || (ticket?.duration as string) || "";
  const actualDuration =
    params.actualDuration || (ticket?.duration as string) || "";
  const parkingFee = (ticket?.parkingFee ?? params.parkingFee) || "200.00";

  useEffect(() => {
    loadTicket();
  }, [params.ticketId]);

  useEffect(() => {
    if (ticket) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            return 0;
          }
          const newTime = prev - 1;

          // Show extend button when time is less than 15 minutes (900 seconds)
          if (newTime <= 900 && !showExtendButton) {
            setShowExtendButton(true);
          }

          // Disable cancel button when time is 10 minutes or less (600 seconds)
          if (newTime <= 600 && canCancel) {
            setCanCancel(false);
            if (ticket?.id) {
              parkingTicketService.updateTicketCancelStatus(
                ticket.ticketId,
                false,
              );
            }
          }

          return newTime;
        });
      }, 1000);

      return () => {
        clearInterval(timer);
      };
    }
  }, [ticket, showExtendButton]);

  const loadTicket = async () => {
    const id = params.ticketId as string | undefined;

    try {
      setIsLoading(true);

      // If ticketId is provided, load that specific ticket
      if (id) {
        const t = await parkingTicketService.getTicketById(id);
        if (t) {
          setTicket(t);
          setTimeRemaining(t.timeRemaining);
        } else {
          setTicket(null);
          Alert.alert("Error", "Ticket not found");
        }
      } else {
        // If no ticketId, get all tickets and find an active one
        const allTickets = await parkingTicketService.getAllTickets();
        const activeTicket = allTickets.find(
          (t) => t.isActive && !t.isPaid && !t.isCancelled,
        );

        if (activeTicket) {
          // Calculate time remaining
          const endTime = new Date(activeTicket.endTime);
          const now = new Date();
          const timeRemaining = Math.max(
            0,
            Math.floor((endTime.getTime() - now.getTime()) / 1000),
          );

          setTicket(activeTicket);
          setTimeRemaining(timeRemaining);
        } else {
          setTicket(null);
          Alert.alert(
            "No Active Ticket",
            "You don't have any active parking tickets.",
            [
              {
                text: "OK",
                onPress: () =>
                  router.push("/screens/parkingOwner/ownerDashboard"),
              },
            ],
          );
        }
      }
    } catch (err) {
      console.error("Failed to load ticket", err);
      setTicket(null);
      Alert.alert("Error", "Failed to load ticket");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    setShowPaymentSelectionModal(true);
  };

  const handleExtendTime = async () => {
    if (!extendDuration) {
      Alert.alert("Missing Information", "Please select extension duration");
      return;
    }

    try {
      setIsProcessing(true);
      const updatedTicket = await parkingTicketService.extendParkingTime(
        ticket!.ticketId,
        extendDuration,
      );
      setTicket(updatedTicket);
      setTimeRemaining(updatedTicket.timeRemaining);
      setShowExtendModal(false);
      setShowExtendButton(false);
      setExtendDuration("");
      Alert.alert("Success", "Parking time extended successfully!");
    } catch (error) {
      console.error("Error extending time:", error);
      Alert.alert("Error", "Failed to extend parking time");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelTicket = () => {
    if (!canCancel) {
      Alert.alert(
        "Cannot Cancel",
        "You can cancel the ticket after 10 minutes from creation",
      );
      return;
    }

    Alert.alert(
      "Cancel Ticket",
      "Are you sure you want to cancel this parking ticket?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: confirmCancel,
        },
      ],
    );
  };

  const confirmCancel = async () => {
    try {
      setIsProcessing(true);
      await parkingTicketService.cancelTicket(ticket!.ticketId);
      Alert.alert(
        "Ticket Cancelled",
        "Your parking ticket has been cancelled",
        [
          {
            text: "OK",
            onPress: () =>
              router.push("/screens/parkingOwner/dashboard/ownerHistory"),
          },
        ],
      );
    } catch (error) {
      console.error("Error cancelling ticket:", error);
      Alert.alert("Error", "Failed to cancel ticket");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentMethodSelected = async (
    method: "stripe" | "paypal" | "payoneer",
    phoneNumber?: string,
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
        "Failed to process payment. Please try again.",
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

      const receipt = await parkingTicketService.payTicket(
        ticket!.ticketId,
        paymentId,
      );

      const receiptInfo: ReceiptData = {
        receiptId: receipt.receiptId,
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
        type: "parking",
        parkingZone: ticket!.parkingZone,
        duration: ticket!.duration,
        startTime: formatDateTime(ticket!.startTime),
        endTime: formatDateTime(ticket!.endTime),
      };

      setReceiptData(receiptInfo);
      setShowReceiptModal(true);

      Alert.alert(
        "Payment Successful",
        "Your parking ticket has been paid successfully!",
      );
    } catch (error) {
      console.error("Payment error:", error);
      Alert.alert(
        "Payment Failed",
        "Failed to process payment. Please try again.",
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
        receiptRef.current,
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
        ],
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

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#093F86" />
        <Text style={styles.loadingText}>Loading ticket...</Text>
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="ticket-outline" size={80} color="#999999" />
        <Text style={styles.errorText}>No Active Ticket</Text>
        <Text style={styles.errorSubtext}>
          You don't have any active parking tickets at the moment.
        </Text>
        <TouchableOpacity
          style={styles.backToHomeButton}
          onPress={() => router.push("/screens/parkingOwner/ownerDashboard")}
        >
          <Text style={styles.backToHomeButtonText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#E8F5E9" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backIcon}
          onPress={() => router.push("/screens/parkingOwner/ownerDashboard")}
        >
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parking Fee Summary</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.vehicleCard}>
          <Text style={styles.vehicleNumber}>{ticket.vehicleNumber}</Text>
        </View>

        <View style={styles.detailsCard}>
          <DetailRow label="Ticket ID" value={ticket.ticketId} />
          <DetailRow label="Parking Zone" value={ticket.parkingZone} />
          {ticket.parkingSection && (
            <DetailRow label="Parking Section" value={ticket.parkingSection} />
          )}
          <DetailRow
            label="Start Time"
            value={formatDateTime(ticket.startTime)}
          />
          <DetailRow label="End Time" value={formatDateTime(ticket.endTime)} />
          <DetailRow label="Duration" value={ticket.duration} />
        </View>

        <View style={styles.feeCard}>
          <Text style={styles.feeLabel}>Parking Fee</Text>
          <Text style={styles.feeValue}>
            Rs. {ticket.parkingFee.toLocaleString()}
          </Text>
        </View>

        <View style={styles.countdownCard}>
          <Text style={styles.countdownLabel}>Time Remaining</Text>
          <Text
            style={[
              styles.countdownValue,
              timeRemaining <= 600 && styles.countdownWarning,
            ]}
          >
            {formatTime(timeRemaining)}
          </Text>
          {timeRemaining <= 600 && (
            <View style={styles.warningBadge}>
              <Ionicons name="warning" size={16} color="#F44336" />
              <Text style={styles.warningText}>
                Less than 10 minutes remaining!
              </Text>
            </View>
          )}
        </View>

        {showExtendButton && (
          <TouchableOpacity
            style={styles.extendButton}
            onPress={() => setShowExtendModal(true)}
            disabled={isProcessing}
          >
            <Ionicons name="time-outline" size={20} color="#FFFFFF" />
            <Text style={styles.extendButtonText}>Extend Time</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.cancelButton,
            (!canCancel || showExtendButton) && styles.cancelButtonDisabled,
          ]}
          onPress={handleCancelTicket}
          disabled={!canCancel || isProcessing || showExtendButton}
        >
          <Text
            style={[
              styles.cancelButtonText,
              (!canCancel || showExtendButton) &&
                styles.cancelButtonTextDisabled,
            ]}
          >
            {canCancel ? "Cancel Ticket" : "Cancel (Disabled)"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
          onPress={handleNext}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.payButtonText}>Pay Ticket</Text>
          )}
        </TouchableOpacity>
      </View>

      <PaymentSelectionModal
        visible={showPaymentSelectionModal}
        amount={ticket?.parkingFee || 0}
        description={`Parking - ${ticket?.parkingZone || ""}`}
        onClose={() => setShowPaymentSelectionModal(false)}
        onPaymentMethodSelected={handlePaymentMethodSelected}
      />

      <PaymentModal
        visible={showStripeCardModal}
        amount={ticket?.parkingFee || 0}
        description={`Parking - ${
          ticket?.parkingZone || ""
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
                      parkingZone={receiptData.parkingZone}
                      duration={receiptData.duration}
                      startTime={receiptData.startTime}
                      endTime={receiptData.endTime}
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

      <Modal
        visible={showExtendModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowExtendModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Extend Time Duration</Text>
              <TouchableOpacity onPress={() => setShowExtendModal(false)}>
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.optionsList}>
              {extendDurations.map((dur, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.optionItem}
                  onPress={() => {
                    setExtendDuration(dur);
                  }}
                >
                  <Text style={styles.optionText}>{dur}</Text>
                  {extendDuration === dur && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalExtendButton}
                onPress={handleExtendTime}
                disabled={isProcessing || !extendDuration}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalExtendButtonText}>Extend Time</Text>
                )}
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 22,
    fontFamily: "Poppins-SemiBold",
    color: "#F44336",
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    textAlign: "center",
    marginBottom: 24,
  },
  backToHomeButton: {
    backgroundColor: "#093F86",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backToHomeButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
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
  vehicleCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
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
  feeCard: {
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
  feeLabel: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#666666",
    marginBottom: 8,
  },
  feeValue: {
    fontSize: 36,
    fontFamily: "Poppins-Bold",
    color: "#4CAF50",
  },
  countdownCard: {
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
  countdownLabel: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#666666",
    marginBottom: 12,
  },
  countdownValue: {
    fontSize: 48,
    fontFamily: "Poppins-Bold",
    color: "#093F86",
  },
  countdownWarning: {
    color: "#F44336",
  },
  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  warningText: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    color: "#F44336",
  },
  extendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F44336",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  extendButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
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
    backgroundColor: "#90CAF9",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  cancelButtonTextDisabled: {
    color: "#9E9E9E",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
  },
  optionsList: {
    paddingHorizontal: 20,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  optionText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#000000",
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalExtendButton: {
    backgroundColor: "#093F86",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  modalExtendButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
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

export default ParkingFeeSummary;
