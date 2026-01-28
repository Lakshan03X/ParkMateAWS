import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import parkingTicketService, {
  ParkingTicket,
} from "../../services/parkingTicketService";

const VerifyVehicle = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { plateNumber } = params;

  const [isLoading, setIsLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState<ParkingTicket | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    checkVehicleStatus();
  }, []);

  useEffect(() => {
    if (activeTicket && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [activeTicket, timeRemaining]);

  const checkVehicleStatus = async () => {
    try {
      setIsLoading(true);
      const ticket = await parkingTicketService.getActiveTicketByVehicleNumber(
        plateNumber as string
      );

      if (ticket) {
        setActiveTicket(ticket);
        setTimeRemaining(ticket.timeRemaining);
      } else {
        setActiveTicket(null);
      }
    } catch (error) {
      console.error("Error checking vehicle status:", error);
    } finally {
      setIsLoading(false);
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#093F86" />
        <Text style={styles.loadingText}>Verifying vehicle...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={activeTicket ? "#E8F5E9" : "#FFEBEE"}
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Verification</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Vehicle Number Card */}
        <View style={styles.vehicleCard}>
          <Text style={styles.vehicleNumber}>{plateNumber}</Text>
        </View>

        {activeTicket ? (
          // AUTHORIZED - Show active ticket details
          <>
            <View style={styles.statusCard}>
              <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
              <Text style={styles.statusTitle}>Authorized Parking</Text>
              <Text style={styles.statusSubtitle}>
                This vehicle has an active parking ticket
              </Text>
            </View>

            <View style={styles.detailsCard}>
              <DetailRow label="Ticket ID" value={activeTicket.ticketId} />
              <DetailRow
                label="Parking Zone"
                value={activeTicket.parkingZone}
              />
              <DetailRow
                label="Start Time"
                value={formatDateTime(activeTicket.startTime)}
              />
              <DetailRow
                label="End Time"
                value={formatDateTime(activeTicket.endTime)}
              />
              <DetailRow label="Duration" value={activeTicket.duration} />
              <DetailRow
                label="Parking Fee"
                value={`Rs. ${activeTicket.parkingFee.toLocaleString()}`}
              />
              <DetailRow
                label="Payment Status"
                value={activeTicket.isPaid ? "Paid" : "Unpaid"}
                valueStyle={
                  activeTicket.isPaid ? styles.paidText : styles.unpaidText
                }
              />
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
          </>
        ) : (
          // UNAUTHORIZED - No active ticket
          <>
            <View style={[styles.statusCard, styles.unauthorizedCard]}>
              <Ionicons name="close-circle" size={80} color="#F44336" />
              <Text style={[styles.statusTitle, styles.unauthorizedTitle]}>
                Unauthorized Parking
              </Text>
              <Text style={styles.statusSubtitle}>
                This vehicle does not have an active parking ticket
              </Text>
            </View>

            <View style={styles.alertCard}>
              <Ionicons name="alert-circle" size={24} color="#F44336" />
              <Text style={styles.alertText}>
                Vehicle is parking without authorization. You may issue a fine
                for this violation.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.issueFineButton}
              onPress={() => {
                // TODO: Navigate to issue fine screen
                router.push({
                  pathname: "/screens/parkingInspector/inspectorActivity",
                  params: { vehicleNumber: plateNumber },
                });
              }}
            >
              <Ionicons name="document-text" size={20} color="#FFFFFF" />
              <Text style={styles.issueFineButtonText}>Issue Fine</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.scanAgainButton}
          onPress={() => router.back()}
        >
          <Ionicons name="camera" size={20} color="#093F86" />
          <Text style={styles.scanAgainButtonText}>Scan Another Vehicle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const DetailRow = ({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: any;
}) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, valueStyle]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#666666",
    marginTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
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
    marginTop: 20,
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
  statusCard: {
    backgroundColor: "#FFFFFF",
    padding: 30,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  unauthorizedCard: {
    borderWidth: 2,
    borderColor: "#F44336",
  },
  statusTitle: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: "#4CAF50",
    marginTop: 16,
    marginBottom: 8,
  },
  unauthorizedTitle: {
    color: "#F44336",
  },
  statusSubtitle: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    textAlign: "center",
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
  paidText: {
    color: "#4CAF50",
    fontFamily: "Poppins-SemiBold",
  },
  unpaidText: {
    color: "#F44336",
    fontFamily: "Poppins-SemiBold",
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
  alertCard: {
    flexDirection: "row",
    backgroundColor: "#FFEBEE",
    padding: 16,
    borderRadius: 12,
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F44336",
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#F44336",
    lineHeight: 20,
  },
  issueFineButton: {
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
  issueFineButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  scanAgainButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#093F86",
  },
  scanAgainButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#093F86",
  },
});

export default VerifyVehicle;
