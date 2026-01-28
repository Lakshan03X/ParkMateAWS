import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
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
import parkingTicketService from "../../../services/parkingTicketService";

interface ParkingSession {
  id: string;
  vehicleNumber: string;
  parkingZone: string;
  startTime: string;
  endTime: string;
  duration: string;
  amount: number;
  status: "completed" | "active" | "cancelled";
  paymentMethod: string;
}

const OwnerHistory = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const formatDateTime = (value: any) => {
    if (!value) return "-";
    try {
      // Firestore Timestamp may have toDate(), otherwise assume string/Date
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

  const [parkingSessions, setParkingSessions] = useState<ParkingSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ParkingSession[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "completed" | "active" | "cancelled"
  >("all");

  useEffect(() => {
    loadParkingHistory();
  }, []);

  useEffect(() => {
    filterSessions();
  }, [selectedFilter, parkingSessions]);

  const loadParkingHistory = async () => {
    try {
      setIsLoading(true);
      const sessions = await parkingTicketService.getAllTickets();

      if (Array.isArray(sessions)) {
        const formattedSessions = sessions.map((session) => {
          let status: "completed" | "active" | "cancelled";
          
          if (session.isCancelled) {
            status = "cancelled";
          } else if (session.isPaid) {
            status = "completed";
          } else if (session.isActive || session.convertedToFine) {
            status = "active";
          } else {
            status = "completed"; // Default fallback
          }

          return {
            id: session.id,
            vehicleNumber: session.vehicleNumber || "Unknown",
            parkingZone: session.parkingZone || "Unknown",
            startTime: session.startTime || "Unknown",
            endTime: session.endTime || "Unknown",
            duration: session.duration || "Unknown",
            amount: session.parkingFee || 0,
            status,
            paymentMethod: session.paymentMethod || "Card",
          };
        });

        setParkingSessions(formattedSessions as ParkingSession[]);
        setFilteredSessions(formattedSessions as ParkingSession[]);
      } else {
        console.error("Invalid data format: sessions is not an array");
      }
    } catch (error) {
      console.error("Error loading parking history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadParkingHistory();
    setIsRefreshing(false);
  };

  const filterSessions = () => {
    if (selectedFilter === "all") {
      setFilteredSessions(parkingSessions);
    } else {
      setFilteredSessions(
        parkingSessions.filter((session) => session.status === selectedFilter)
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#4CAF50";
      case "active":
        return "#2196F3";
      case "cancelled":
        return "#F44336";
      default:
        return "#666";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "checkmark-circle";
      case "active":
        return "time";
      case "cancelled":
        return "close-circle";
      default:
        return "information-circle";
    }
  };

  const renderFilterButton = (
    filter: "all" | "completed" | "active" | "cancelled",
    label: string
  ) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive,
      ]}
      onPress={() => setSelectedFilter(filter)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedFilter === filter && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderParkingSession = (session: ParkingSession) => {
    const status = session.status || "unknown"; // Default to "unknown" if status is undefined
    const amount = session.amount ?? 0; // Default to 0 if amount is undefined

    return (
      <View key={session.id} style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
          <View style={styles.sessionHeaderLeft}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(status) },
              ]}
            >
              <Ionicons
                name={getStatusIcon(status) as any}
                size={14}
                color="#FFFFFF"
              />
              <Text style={styles.statusText}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </View>
            <Text style={styles.sessionId}>#{session.id}</Text>
          </View>
        </View>

        <View style={styles.sessionBody}>
          <View style={styles.sessionRow}>
            <View style={styles.sessionRowIcon}>
              <Ionicons name="car-sport" size={20} color="#093F86" />
            </View>
            <View style={styles.sessionRowContent}>
              <Text style={styles.sessionRowLabel}>Vehicle Number</Text>
              <Text style={styles.sessionRowValue}>
                {session.vehicleNumber}
              </Text>
            </View>
          </View>

          <View style={styles.sessionRow}>
            <View style={styles.sessionRowIcon}>
              <Ionicons name="location" size={20} color="#093F86" />
            </View>
            <View style={styles.sessionRowContent}>
              <Text style={styles.sessionRowLabel}>Parking Zone</Text>
              <Text style={styles.sessionRowValue}>{session.parkingZone}</Text>
            </View>
          </View>

          <View style={styles.sessionRow}>
            <View style={styles.sessionRowIcon}>
              <Ionicons name="time" size={20} color="#093F86" />
            </View>
            <View style={styles.sessionRowContent}>
              <Text style={styles.sessionRowLabel}>Duration</Text>
              <Text style={styles.sessionRowValue}>{session.duration}</Text>
            </View>
          </View>

          <View style={styles.sessionTimeContainer}>
            <View style={styles.sessionTime}>
              <Text style={styles.sessionTimeLabel}>Start</Text>
              <Text style={styles.sessionTimeValue}>
                {formatDateTime(session.startTime)}
              </Text>
            </View>
            <View style={styles.sessionTimeDivider} />
            <View style={styles.sessionTime}>
              <Text style={styles.sessionTimeLabel}>End</Text>
              <Text style={styles.sessionTimeValue}>
                {formatDateTime(session.endTime)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sessionFooter}>
          <View style={styles.sessionFooterLeft}>
            <Ionicons name="card" size={16} color="#666" />
            <Text style={styles.paymentMethodText}>
              {session.paymentMethod}
            </Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Total</Text>
            <Text style={styles.amountValue}>Rs. {amount.toFixed(2)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Safe Area Background */}
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/screens/parkingOwner/ownerDashboard")}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Parking History</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {renderFilterButton("all", "All")}
            {renderFilterButton("completed", "Completed")}
            {renderFilterButton("active", "Active")}
            {renderFilterButton("cancelled", "Cancelled")}
          </ScrollView>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#093F86" />
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : filteredSessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={80} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No History Found</Text>
            <Text style={styles.emptySubtitle}>
              {selectedFilter === "all"
                ? "You haven't parked any vehicle yet"
                : `No ${selectedFilter} parking sessions found`}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor="#093F86"
                colors={["#093F86"]}
              />
            }
          >
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Total Sessions</Text>
              <Text style={styles.summaryValue}>{filteredSessions.length}</Text>
            </View>

            {filteredSessions.map(renderParkingSession)}
          </ScrollView>
        )}
      </SafeAreaView>
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
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    width: 40,
  },
  filterContainer: {
    backgroundColor: "transparent",
    paddingBottom: 16,
  },
  filterScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  filterButtonActive: {
    backgroundColor: "#FFFFFF",
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#FFFFFF",
  },
  filterButtonTextActive: {
    color: "#093F86",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#333333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 32,
    fontFamily: "Poppins-Bold",
    color: "#093F86",
  },
  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F8F9FA",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  sessionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    color: "#FFFFFF",
  },
  sessionId: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    color: "#666666",
  },
  sessionBody: {
    padding: 16,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sessionRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sessionRowContent: {
    flex: 1,
  },
  sessionRowLabel: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    marginBottom: 2,
  },
  sessionRowValue: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
  },
  sessionTimeContainer: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  sessionTime: {
    flex: 1,
  },
  sessionTimeLabel: {
    fontSize: 11,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    marginBottom: 4,
  },
  sessionTimeValue: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    color: "#000000",
  },
  sessionTimeDivider: {
    width: 1,
    backgroundColor: "#D0D0D0",
    marginHorizontal: 12,
  },
  sessionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F8F9FA",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  sessionFooterLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  paymentMethodText: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#666666",
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amountLabel: {
    fontSize: 11,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: "#093F86",
  },
});

export default OwnerHistory;
