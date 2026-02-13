import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const McAdminDashboard = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Statistics data
  const stats = [
    { label: "Active Tickets", value: "1054" },
    { label: "Total Revenue", value: "Rs 507 000" },
    { label: "Violations", value: "279" },
    { label: "Parking Inspectors", value: "180" },
  ];

  return (
    <View style={styles.container}>
      {/* Top Safe Area Background */}
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <StatusBar barStyle="light-content" />

        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 10 }]}
          onPress={() => router.replace("/screens/mcAdmin/adminLogin")}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 60 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Dashboard Title */}
          <Text style={styles.dashboardTitle}>Dashboard</Text>

          {/* Statistics Cards */}
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* System Management Section */}
          <View style={styles.managementSection}>
            <Text style={styles.sectionTitle}>System Management</Text>

            <View style={styles.buttonContainer}>
              {/* Pending Zones Verification Button */}
              <TouchableOpacity
                style={[styles.actionButton, styles.warningButton]}
                onPress={() => {
                  console.log("Navigate to Pending Zones");
                  router.push("/screens/mcAdmin/pendingZonesVerification");
                }}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  <Ionicons name="time-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Verify Pending Zones</Text>
                </View>
              </TouchableOpacity>

              {/* Configure Zone Button */}
              {/* <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={() => {
                  console.log("Navigate to Configure Zone");
                  router.push("/screens/mcAdmin/configureZone");
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Configure Zone</Text>
              </TouchableOpacity> */}

              {/* Parking Revenue Button */}
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => {
                  console.log("Navigate to Parking Revenue");
                  router.push("/screens/mcAdmin/parkingRevenue");
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Parking Revenue</Text>
              </TouchableOpacity>

              {/* Manage Inspectors Button */}
              <TouchableOpacity
                style={[styles.actionButton, styles.tertiaryButton]}
                onPress={() => {
                  console.log("Navigate to Manage Inspectors");
                  router.push("/screens/mcAdmin/mcInspectorManage");
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Manage Inspectors</Text>
              </TouchableOpacity>

              {/* Notifications Button */}
              <TouchableOpacity
                style={[styles.actionButton, styles.quaternaryButton]}
                onPress={() => {
                  console.log("Navigate to Notifications");
                  // router.push("/screens/mcAdmin/dashboard/notifications");
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Notifications</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    backgroundColor: "#4CAF50",
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
  },
  backButton: {
    position: "absolute",
    left: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  dashboardTitle: {
    fontSize: 24,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 30,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    width: "48%",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: "#000000",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666666",
  },
  managementSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  buttonContainer: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButton: {
    backgroundColor: "#093F86",
  },
  secondaryButton: {
    backgroundColor: "#093F86",
  },
  tertiaryButton: {
    backgroundColor: "#093F86",
  },
  quaternaryButton: {
    backgroundColor: "#093F86",
  },
  warningButton: {
    backgroundColor: "#FF9800",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
});

export default McAdminDashboard;
