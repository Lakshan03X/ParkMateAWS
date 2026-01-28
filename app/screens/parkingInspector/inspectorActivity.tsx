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

interface ActivityData {
  scannedVehicles: number;
  validVehicles: number;
  violatedVehicles: number;
}

interface ZoneInfo {
  zoneName: string;
  location: string;
  timeRange: string;
  date: string;
}

const InspectorActivity = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activityData, setActivityData] = useState<ActivityData>({
    scannedVehicles: 54,
    validVehicles: 49,
    violatedVehicles: 5,
  });

  const [zoneInfo, setZoneInfo] = useState<ZoneInfo>({
    zoneName: "Zone A - School Lane",
    location: "School Lane Area",
    timeRange: "From 8.00 AM to 2.00 PM",
    date: "28/07/2025",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);

  useEffect(() => {
    // Load today's activity data
    loadActivityData();
    checkUnreadNotifications();
  }, []);

  const loadActivityData = async () => {
    setIsLoading(true);
    try {
      // TODO: Fetch real activity data from service
      // const data = await inspectorService.getTodayActivity();
      // setActivityData(data);
    } catch (error) {
      console.error("Failed to load activity data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkUnreadNotifications = async () => {
    try {
      // TODO: Check for unread notifications from service
      // const unreadCount = await inspectorService.getUnreadNotificationCount();
      // setHasUnreadNotifications(unreadCount > 0);

      // Demo: Set to true to show the red dot indicator
      setHasUnreadNotifications(true);
    } catch (error) {
      console.error("Failed to check notifications:", error);
    }
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
          <Text style={styles.headerTitle}>Today's Activity</Text>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() =>
              router.push("/screens/parkingInspector/inspectorActivityNotfy")
            }
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            {hasUnreadNotifications && (
              <View style={styles.notificationBadge} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#093F86" />
            </View>
          ) : (
            <>
              {/* Activity Statistics Card */}
              <View style={styles.statsCard}>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {activityData.scannedVehicles}
                    </Text>
                    <Text style={styles.statLabel}>Scanned{"\n"}vehicles</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {activityData.validVehicles}
                    </Text>
                    <Text style={styles.statLabel}>Valid{"\n"}vehicles</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {activityData.violatedVehicles}
                    </Text>
                    <Text style={styles.statLabel}>Violated{"\n"}vehicles</Text>
                  </View>
                </View>
              </View>

              {/* Zone Information Card */}
              <View style={styles.zoneCard}>
                <View style={styles.zoneHeader}>
                  <Text style={styles.zoneName}>{zoneInfo.zoneName}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      router.push("/screens/parkingInspector/inspectorZoneMap")
                    }
                    activeOpacity={0.7}
                  >
                    <Ionicons name="location" size={24} color="#6EAD6E" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.zoneTime}>{zoneInfo.timeRange}</Text>
                <Text style={styles.zoneDate}>{zoneInfo.date}</Text>
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
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  notificationButton: {
    padding: 8,
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF3B30",
    borderWidth: 2,
    borderColor: "#6EAD6E",
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
    marginBottom: 20,
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
    fontSize: 48,
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
  zoneCard: {
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
  zoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  zoneName: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    flex: 1,
  },
  zoneTime: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    marginBottom: 8,
  },
  zoneDate: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
  },
});

export default InspectorActivity;
