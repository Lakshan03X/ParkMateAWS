import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import awsDynamoService from "../../services/awsDynamoService";
import parkingZoneService, {
  ParkingZone,
} from "../../services/parkingZoneService";

interface ParkingTicket {
  id: string;
  parkingZone: string;
  parkingFee: number;
  isPaid: boolean;
  createdAt: string;
}

interface RevenueData {
  daily: number;
  weekly: number;
}

const ParkingRevenue = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState("");
  const [zones, setZones] = useState<ParkingZone[]>([]);
  const [filteredZones, setFilteredZones] = useState<ParkingZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<Record<string, RevenueData>>(
    {},
  );
  const [revenuePeriod, setRevenuePeriod] = useState<"daily" | "weekly">(
    "daily",
  );

  const TICKETS_COLLECTION = "parkmate-parking-tickets";

  // Load parking zones and calculate revenue
  useEffect(() => {
    loadParkingZonesAndRevenue();
  }, []);

  const loadParkingZonesAndRevenue = async () => {
    try {
      setIsLoading(true);

      // Fetch verified zones only
      const allZones = await parkingZoneService.getAllParkingZones();
      const verifiedZones = allZones.filter(
        (zone) =>
          zone.verificationStatus === "verified" && zone.status === "active",
      );

      setZones(verifiedZones);
      setFilteredZones(verifiedZones);

      // Calculate revenue after loading zones
      if (verifiedZones.length > 0) {
        await calculateZoneRevenue(verifiedZones);
      }
    } catch (error: any) {
      console.error("Error loading parking zones:", error);
      Alert.alert("Error", error.message || "Failed to load parking zones");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate revenue for each zone
  const calculateZoneRevenue = async (zonesList: ParkingZone[]) => {
    try {
      // Fetch all parking tickets
      const ticketsResult = await awsDynamoService.scan(TICKETS_COLLECTION);
      const tickets: ParkingTicket[] = ticketsResult.items || [];

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const revenueByZone: Record<string, RevenueData> = {};

      // Initialize revenue data for each zone
      zonesList.forEach((zone) => {
        const zoneKey = `${zone.municipalCouncil}-${zone.zoneCode}`;
        revenueByZone[zoneKey] = { daily: 0, weekly: 0 };
      });

      // Calculate revenue from paid tickets
      tickets.forEach((ticket) => {
        if (ticket.isPaid && ticket.createdAt) {
          const ticketDate = new Date(ticket.createdAt);
          const zoneKey = ticket.parkingZone;

          if (!revenueByZone[zoneKey]) {
            revenueByZone[zoneKey] = { daily: 0, weekly: 0 };
          }

          // Daily revenue (last 24 hours)
          if (ticketDate >= oneDayAgo) {
            revenueByZone[zoneKey].daily += ticket.parkingFee || 0;
          }

          // Weekly revenue (last 7 days)
          if (ticketDate >= oneWeekAgo) {
            revenueByZone[zoneKey].weekly += ticket.parkingFee || 0;
          }
        }
      });

      setRevenueData(revenueByZone);
    } catch (error) {
      console.error("Error calculating zone revenue:", error);
    }
  };

  // Filter zones based on search query
  useEffect(() => {
    let filtered = zones;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (zone) =>
          zone.municipalCouncil
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          zone.zoneCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          zone.location.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    setFilteredZones(filtered);
  }, [searchQuery, zones]);

  const renderRevenueCard = ({ item }: { item: ParkingZone }) => {
    const zoneKey = `${item.municipalCouncil}-${item.zoneCode}`;
    const revenue = revenueData[zoneKey] || { daily: 0, weekly: 0 };
    const displayRevenue =
      revenuePeriod === "daily" ? revenue.daily : revenue.weekly;

    return (
      <View style={styles.revenueCard}>
        <View style={styles.revenueHeader}>
          <View style={styles.revenueInfo}>
            <Text style={styles.revenueMunicipal}>
              {item.municipalCouncil} Municipal Council
            </Text>
            <Text style={styles.revenueZone}>
              Zone {item.zoneCode} - {item.location}
            </Text>
            <Text style={styles.revenueRate}>
              Rate: Rs. {item.parkingRate}/hr
            </Text>
            <View style={styles.spotsBadge}>
              <Ionicons name="car" size={14} color="#1976D2" />
              <Text style={styles.spotsText}>
                {item.totalParkingSpots} spots
              </Text>
            </View>
          </View>
        </View>

        {/* Revenue Display */}
        <View style={styles.revenueStatsContainer}>
          <View style={styles.revenueStatBox}>
            <Text style={styles.revenueStatLabel}>
              {revenuePeriod === "daily" ? "Daily Revenue" : "Weekly Revenue"}
            </Text>
            <Text style={styles.revenueStatValue}>
              Rs. {displayRevenue.toFixed(2)}
            </Text>
          </View>
          {revenuePeriod === "daily" && (
            <View style={styles.revenueStatBox}>
              <Text style={styles.revenueStatLabel}>Weekly Revenue</Text>
              <Text style={styles.revenueStatValueSecondary}>
                Rs. {revenue.weekly.toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        {/* Zone Details */}
        <View style={styles.zoneDetailsContainer}>
          <View style={styles.zoneDetail}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.zoneDetailText}>{item.activeHours}</Text>
          </View>
          {item.parkingSections && (
            <View style={styles.zoneDetail}>
              <Ionicons name="grid-outline" size={16} color="#666" />
              <Text style={styles.zoneDetailText}>
                {item.parkingSections} sections
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Safe Area Background */}
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Parking Revenue</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadParkingZonesAndRevenue}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons
                name="search"
                size={20}
                color="#666"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search Zones"
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Revenue Period Selector */}
          <View style={styles.periodSelectorContainer}>
            <Text style={styles.periodLabel}>Revenue Period:</Text>
            <View style={styles.periodButtons}>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  revenuePeriod === "daily" && styles.periodButtonActive,
                ]}
                onPress={() => setRevenuePeriod("daily")}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    revenuePeriod === "daily" && styles.periodButtonTextActive,
                  ]}
                >
                  Daily
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  revenuePeriod === "weekly" && styles.periodButtonActive,
                ]}
                onPress={() => setRevenuePeriod("weekly")}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    revenuePeriod === "weekly" && styles.periodButtonTextActive,
                  ]}
                >
                  Weekly
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Total Revenue Summary */}
          {!isLoading && filteredZones.length > 0 && (
            <View style={styles.totalRevenueContainer}>
              <View style={styles.totalRevenueBox}>
                <Text style={styles.totalRevenueLabel}>
                  Total {revenuePeriod === "daily" ? "Daily" : "Weekly"} Revenue
                </Text>
                <Text style={styles.totalRevenueValue}>
                  Rs.{" "}
                  {Object.values(revenueData)
                    .reduce(
                      (sum, data) =>
                        sum +
                        (revenuePeriod === "daily" ? data.daily : data.weekly),
                      0,
                    )
                    .toFixed(2)}
                </Text>
              </View>
            </View>
          )}

          {/* Zones List */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Loading parking revenue...</Text>
            </View>
          ) : filteredZones.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cash-outline" size={64} color="#FFFFFF" />
              <Text style={styles.emptyText}>No parking zones found</Text>
              {searchQuery.length > 0 && (
                <Text style={styles.emptySubtext}>
                  Try adjusting your search
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.listContainer}>
              {filteredZones.map((item) => (
                <View key={item.id}>{renderRevenueCard({ item })}</View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#4CAF50",
  },
  topSafeArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#4CAF50",
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#4CAF50",
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#000",
  },
  periodSelectorContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  periodLabel: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  periodButtons: {
    flexDirection: "row",
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  periodButtonActive: {
    backgroundColor: "#093F86",
  },
  periodButtonText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#FFFFFF",
  },
  periodButtonTextActive: {
    color: "#FFFFFF",
  },
  totalRevenueContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  totalRevenueBox: {
    backgroundColor: "#093F86",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  totalRevenueLabel: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#FFFFFF",
    opacity: 0.9,
    marginBottom: 4,
  },
  totalRevenueValue: {
    fontSize: 32,
    fontFamily: "Poppins-Bold",
    color: "#FFFFFF",
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  revenueCard: {
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
  revenueHeader: {
    marginBottom: 12,
  },
  revenueInfo: {
    flex: 1,
  },
  revenueMunicipal: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    marginBottom: 6,
  },
  revenueZone: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#666",
    marginBottom: 6,
  },
  revenueRate: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
    marginBottom: 8,
  },
  spotsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
    gap: 4,
  },
  spotsText: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    color: "#1976D2",
  },
  revenueStatsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  revenueStatBox: {
    flex: 1,
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  revenueStatLabel: {
    fontSize: 11,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginBottom: 4,
    textAlign: "center",
  },
  revenueStatValue: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: "#4CAF50",
  },
  revenueStatValueSecondary: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#2E7D32",
  },
  zoneDetailsContainer: {
    flexDirection: "row",
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  zoneDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  zoneDetailText: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#FFFFFF",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#FFFFFF",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#FFFFFF",
    opacity: 0.8,
    marginTop: 8,
  },
});

export default ParkingRevenue;
