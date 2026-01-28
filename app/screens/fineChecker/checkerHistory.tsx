import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

interface HistoryItem {
  id: string;
  vehicleNumber: string;
  zone: string;
  date: string;
  status: "resolved";
}

const CheckerHistory = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [violatedCount, setViolatedCount] = useState(750);
  const [resolvedCount, setResolvedCount] = useState(745);
  const [pendingCount, setPendingCount] = useState(5);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  // Load history data
  useEffect(() => {
    loadHistoryData();
  }, []);

  const loadHistoryData = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual service call
      const mockHistory: HistoryItem[] = [
        {
          id: "1",
          vehicleNumber: "BBA2356",
          zone: "Zone A - School Lane",
          date: "28/07/2025",
          status: "resolved",
        },
        {
          id: "2",
          vehicleNumber: "CAB6998",
          zone: "Zone B - Market Road",
          date: "26/07/2025",
          status: "resolved",
        },
        {
          id: "3",
          vehicleNumber: "XYZ1234",
          zone: "Zone C - Main Street",
          date: "25/07/2025",
          status: "resolved",
        },
        {
          id: "4",
          vehicleNumber: "DEF5678",
          zone: "Zone A - School Lane",
          date: "24/07/2025",
          status: "resolved",
        },
        {
          id: "5",
          vehicleNumber: "GHI9012",
          zone: "Zone D - Park Avenue",
          date: "23/07/2025",
          status: "resolved",
        },
      ];

      setHistoryItems(mockHistory);
    } catch (error) {
      console.error("Failed to load history data:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistoryData();
    setRefreshing(false);
  };

  const handleHistoryItemPress = (item: HistoryItem) => {
    console.log("Selected history item:", item);
    // Navigate to violation details screen
    // router.push({
    //   pathname: "/screens/fineChecker/violationDetails",
    //   params: { violationId: item.id }
    // });
  };

  const handleLocationPress = (item: HistoryItem) => {
    console.log("Show location for:", item.vehicleNumber);
    // Navigate to map or show location details
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
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>History</Text>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => {
              // Navigate to notifications
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#093F86" />
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {/* Statistics Cards */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{violatedCount}</Text>
                <Text style={styles.statLabel}>Violated{"\n"}vehicles</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{resolvedCount}</Text>
                <Text style={styles.statLabel}>Resolved</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {pendingCount.toString().padStart(2, "0")}
                </Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>

            {/* Section Title */}
            <Text style={styles.sectionTitle}>Last Activities</Text>

            {/* History List */}
            <View style={styles.listContainer}>
              {historyItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.historyCard}
                  onPress={() => handleHistoryItemPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.vehicleNumber}>
                      {item.vehicleNumber}
                    </Text>
                    <TouchableOpacity
                      style={styles.locationButton}
                      onPress={() => handleLocationPress(item)}
                    >
                      <Ionicons name="location" size={18} color="#666666" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.zoneText}>{item.zone}</Text>
                  <Text style={styles.dateText}>{item.date}</Text>

                  {/* Status Bar */}
                  <View style={styles.statusBarContainer}>
                    <View style={styles.statusBar}>
                      <Text style={styles.statusText}>Resolved</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Load More Button */}
            <TouchableOpacity style={styles.loadMoreButton} activeOpacity={0.7}>
              <Text style={styles.loadMoreText}>Load More</Text>
              <Ionicons name="chevron-down" size={20} color="#4CAF50" />
            </TouchableOpacity>
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
    backgroundColor: "#4CAF50",
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  notificationButton: {
    padding: 8,
    borderRadius: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  statNumber: {
    fontSize: 32,
    fontFamily: "Poppins-Bold",
    color: "#000000",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    textAlign: "center",
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    marginLeft: 20,
    marginBottom: 16,
  },
  listContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
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
    marginBottom: 8,
  },
  vehicleNumber: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
  },
  locationButton: {
    padding: 4,
  },
  zoneText: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#999999",
    marginBottom: 12,
  },
  statusBarContainer: {
    alignItems: "center",
  },
  statusBar: {
    width: "100%",
    backgroundColor: "#E8F5E9",
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
  },
  statusText: {
    fontSize: 13,
    fontFamily: "Poppins-SemiBold",
    color: "#4CAF50",
  },
  loadMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 40,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#4CAF50",
  },
});

export default CheckerHistory;
