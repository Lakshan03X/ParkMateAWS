import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

interface ViolationItem {
  id: string;
  vehicleNumber: string;
  zone: string;
  date: string;
  status: "pending" | "resolved";
}

const CheckerActivity = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [violatedCount, setViolatedCount] = useState(5);
  const [resolvedCount, setResolvedCount] = useState(4);
  const [pendingCount, setPendingCount] = useState(1);
  const [violations, setViolations] = useState<ViolationItem[]>([]);

  // Load activity data
  useEffect(() => {
    loadActivityData();
  }, []);

  const loadActivityData = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual service call
      const mockViolations: ViolationItem[] = [
        {
          id: "1",
          vehicleNumber: "ABC3344",
          zone: "Zone A - School Lane",
          date: "28/07/2025",
          status: "pending",
        },
        {
          id: "2",
          vehicleNumber: "XYZ1234",
          zone: "Zone B - Market Street",
          date: "28/07/2025",
          status: "resolved",
        },
        {
          id: "3",
          vehicleNumber: "DEF5678",
          zone: "Zone A - School Lane",
          date: "28/07/2025",
          status: "resolved",
        },
        {
          id: "4",
          vehicleNumber: "GHI9012",
          zone: "Zone C - Main Road",
          date: "28/07/2025",
          status: "resolved",
        },
        {
          id: "5",
          vehicleNumber: "JKL3456",
          zone: "Zone B - Market Street",
          date: "28/07/2025",
          status: "resolved",
        },
      ];

      setViolations(mockViolations);
      setViolatedCount(mockViolations.length);
      setResolvedCount(
        mockViolations.filter((v) => v.status === "resolved").length
      );
      setPendingCount(
        mockViolations.filter((v) => v.status === "pending").length
      );
    } catch (error) {
      console.error("Failed to load activity data:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadActivityData();
    setRefreshing(false);
  };

  const handleViolationPress = (violation: ViolationItem) => {
    console.log("Selected violation:", violation);
    // Navigate to violation details screen
    // router.push({
    //   pathname: "/screens/fineChecker/violationDetails",
    //   params: { violationId: violation.id }
    // });
  };

  const handleStatusPress = (violation: ViolationItem) => {
    if (violation.status === "pending") {
      Alert.alert(
        "Confirm Resolution",
        `Are you sure you want to mark ${violation.vehicleNumber} as resolved?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Confirm",
            onPress: () => {
              // Update the violation status to resolved
              setViolations((prevViolations) =>
                prevViolations.map((v) =>
                  v.id === violation.id
                    ? { ...v, status: "resolved" as const }
                    : v
                )
              );

              // Update counts
              setResolvedCount((prev) => prev + 1);
              setPendingCount((prev) => prev - 1);
            },
          },
        ],
        { cancelable: false }
      );
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
                <Text style={styles.statNumber}>
                  {violatedCount.toString().padStart(2, "0")}
                </Text>
                <Text style={styles.statLabel}>Violated{"\n"}vehicles</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {resolvedCount.toString().padStart(2, "0")}
                </Text>
                <Text style={styles.statLabel}>Resolved</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {pendingCount.toString().padStart(2, "0")}
                </Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>

            {/* Violations List */}
            <View style={styles.listContainer}>
              {violations.map((violation) => (
                <TouchableOpacity
                  key={violation.id}
                  style={styles.violationCard}
                  onPress={() => handleViolationPress(violation)}
                  activeOpacity={0.7}
                >
                  <View style={styles.violationHeader}>
                    <Text style={styles.vehicleNumber}>
                      {violation.vehicleNumber}
                    </Text>
                    <TouchableOpacity style={styles.locationButton}>
                      <Ionicons name="location" size={18} color="#666666" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.zoneText}>{violation.zone}</Text>
                  <Text style={styles.dateText}>{violation.date}</Text>

                  {/* Status Bar */}
                  <View style={styles.statusBarContainer}>
                    <TouchableOpacity
                      style={[
                        styles.statusBar,
                        violation.status === "resolved"
                          ? styles.statusBarResolved
                          : styles.statusBarPending,
                      ]}
                      onPress={() => handleStatusPress(violation)}
                      disabled={violation.status === "resolved"}
                      activeOpacity={violation.status === "pending" ? 0.7 : 1}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          violation.status === "resolved"
                            ? styles.statusTextResolved
                            : styles.statusTextPending,
                        ]}
                      >
                        {violation.status === "resolved"
                          ? "Resolved"
                          : "Pending"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
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
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  violationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  violationHeader: {
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
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
  },
  statusBarResolved: {
    backgroundColor: "#E8F5E9",
  },
  statusBarPending: {
    backgroundColor: "#E3F2FD",
  },
  statusText: {
    fontSize: 13,
    fontFamily: "Poppins-SemiBold",
  },
  statusTextResolved: {
    color: "#4CAF50",
  },
  statusTextPending: {
    color: "#2196F3",
  },
});

export default CheckerActivity;
