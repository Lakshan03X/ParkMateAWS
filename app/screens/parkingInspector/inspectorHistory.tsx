import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import inspectorService from "../../services/inspectorService";

interface HistoryStats {
  scannedVehicles: number;
  validVehicles: number;
  violatedVehicles: number;
}

interface VehicleRecord {
  id: string;
  vehicleNumber: string;
  ticketId: string;
  parkingZone: string;
  parkingSection: string;
  scanTime: string;
  status: "valid" | "violated" | "cancelled";
  duration: string;
  fee: number;
  isPaid: boolean;
  isActive: boolean;
  reason: string;
  type: "ticket" | "fine";
}

const InspectorHistory = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [historyStats, setHistoryStats] = useState<HistoryStats>({
    scannedVehicles: 0,
    validVehicles: 0,
    violatedVehicles: 0,
  });

  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const historyData = await inspectorService.getScannedVehiclesHistory();

      console.log("📊 History loaded:", {
        total: historyData.vehicles.length,
        stats: historyData.stats,
      });

      setHistoryStats(historyData.stats);
      setVehicles(historyData.vehicles);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const toggleCard = (vehicleId: string) => {
    setExpandedCard(expandedCard === vehicleId ? null : vehicleId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "valid":
        return "#6EAD6E";
      case "violated":
        return "#FF4444";
      case "cancelled":
        return "#FF9800";
      default:
        return "#666666";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return "checkmark-circle";
      case "violated":
        return "alert-circle";
      case "cancelled":
        return "close-circle";
      default:
        return "ellipse";
    }
  };

  const renderVehicleCard = (vehicle: VehicleRecord) => {
    const isExpanded = expandedCard === vehicle.id;
    const statusColor = getStatusColor(vehicle.status);

    return (
      <TouchableOpacity
        key={vehicle.id}
        style={styles.vehicleCard}
        onPress={() => toggleCard(vehicle.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleNumber}>{vehicle.vehicleNumber}</Text>
            <Text style={styles.ticketId}>#{vehicle.ticketId}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Ionicons
              name={getStatusIcon(vehicle.status) as any}
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.statusText}>
              {vehicle.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.cardInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color="#666666" />
            <Text style={styles.infoText}>
              {vehicle.parkingZone}
              {vehicle.parkingSection ? ` - ${vehicle.parkingSection}` : ""}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time" size={16} color="#666666" />
            <Text style={styles.infoText}>
              {formatDate(vehicle.scanTime)} at {formatTime(vehicle.scanTime)}
            </Text>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.expandedInfo}>
            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type:</Text>
              <Text style={styles.detailValue}>
                {vehicle.type === "fine" ? "Fine" : "Parking Ticket"}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>
                {vehicle.duration || "N/A"}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fee:</Text>
              <Text style={styles.detailValue}>
                Rs. {vehicle.fee.toFixed(2)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Status:</Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: vehicle.isPaid ? "#6EAD6E" : "#FF4444" },
                ]}
              >
                {vehicle.isPaid ? "Paid" : "Unpaid"}
              </Text>
            </View>

            {vehicle.reason && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reason:</Text>
                <Text style={[styles.detailValue, { flex: 1 }]}>
                  {vehicle.reason}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={styles.detailValue}>
                {vehicle.isActive ? "Active" : "Completed"}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.expandHint}>
            {isExpanded ? "Tap to collapse" : "Tap to view details"}
          </Text>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#999999"
          />
        </View>
      </TouchableOpacity>
    );
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
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>History</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#6EAD6E"]}
            />
          }
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6EAD6E" />
            </View>
          ) : (
            <>
              {/* Overall Statistics Card */}
              <View style={styles.statsCard}>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {historyStats.scannedVehicles}
                    </Text>
                    <Text style={styles.statLabel}>Scanned{"\n"}vehicles</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {historyStats.validVehicles}
                    </Text>
                    <Text style={styles.statLabel}>Valid{"\n"}vehicles</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {historyStats.violatedVehicles}
                    </Text>
                    <Text style={styles.statLabel}>Violated{"\n"}vehicles</Text>
                  </View>
                </View>
              </View>

              {/* Scanned Vehicles Section */}
              <View style={styles.vehiclesSection}>
                <Text style={styles.sectionTitle}>
                  Scanned Vehicles ({vehicles.length})
                </Text>

                {vehicles.map((vehicle) => renderVehicleCard(vehicle))}

                {vehicles.length === 0 && (
                  <View style={styles.emptyState}>
                    <Ionicons name="car-outline" size={64} color="#CCCCCC" />
                    <Text style={styles.emptyStateText}>
                      No scanned vehicles yet
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
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
    backgroundColor: "#000000",
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
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  statsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 36,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    textAlign: "center",
    lineHeight: 18,
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: "#E0E0E0",
  },
  vehiclesSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    marginBottom: 16,
  },
  vehicleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleNumber: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: "#000000",
    marginBottom: 2,
  },
  ticketId: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#999999",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  cardInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    flex: 1,
  },
  expandedInfo: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#666666",
  },
  detailValue: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#000000",
    textAlign: "right",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    gap: 4,
  },
  expandHint: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#999999",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#999999",
    marginTop: 16,
  },
});

export default InspectorHistory;
