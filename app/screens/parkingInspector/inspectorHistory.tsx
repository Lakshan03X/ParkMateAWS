import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

interface HistoryStats {
  scannedVehicles: number;
  validVehicles: number;
  violatedVehicles: number;
}

interface ActivityRecord {
  id: string;
  zoneName: string;
  timeRange: string;
  date: string;
  scannedVehicles: number;
  validVehicles: number;
  violatedVehicles: number;
}

const InspectorHistory = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [historyStats, setHistoryStats] = useState<HistoryStats>({
    scannedVehicles: 2800,
    validVehicles: 2450,
    violatedVehicles: 350,
  });

  const [activities, setActivities] = useState<ActivityRecord[]>([
    {
      id: "1",
      zoneName: "Zone A - School Lane",
      timeRange: "From 8.00 AM to 2.00 PM",
      date: "28/07/2025",
      scannedVehicles: 54,
      validVehicles: 49,
      violatedVehicles: 5,
    },
    {
      id: "2",
      zoneName: "Zone B - Market Road",
      timeRange: "From 3.00 PM to 5.00 PM",
      date: "26/07/2025",
      scannedVehicles: 42,
      validVehicles: 38,
      violatedVehicles: 4,
    },
    {
      id: "3",
      zoneName: "Zone C - Hospital Road",
      timeRange: "From 8.00 AM to 2.00 PM",
      date: "24/07/2025",
      scannedVehicles: 61,
      validVehicles: 55,
      violatedVehicles: 6,
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      // TODO: Fetch history from service
      // const history = await inspectorService.getHistory();
      // setHistoryStats(history.stats);
      // setActivities(history.activities);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivityPress = (activity: ActivityRecord) => {
    console.log("Activity pressed:", activity.id);
    // Navigate to activity details if needed
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

              {/* Last Activities Section */}
              <View style={styles.activitiesSection}>
                <Text style={styles.sectionTitle}>Last Activities</Text>

                {activities.map((activity) => (
                  <TouchableOpacity
                    key={activity.id}
                    style={styles.activityCard}
                    onPress={() => handleActivityPress(activity)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.activityZone}>{activity.zoneName}</Text>
                    <Text style={styles.activityTime}>
                      {activity.timeRange}
                    </Text>
                    <Text style={styles.activityDate}>{activity.date}</Text>
                  </TouchableOpacity>
                ))}

                {activities.length === 0 && (
                  <View style={styles.emptyState}>
                    <Ionicons
                      name="document-text-outline"
                      size={64}
                      color="#CCCCCC"
                    />
                    <Text style={styles.emptyStateText}>
                      No activity history yet
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
  activitiesSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    marginBottom: 16,
  },
  activityCard: {
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
  activityZone: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    marginBottom: 8,
  },
  activityTime: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
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
