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
import { LinearGradient } from "expo-linear-gradient";

const SysAdminDashboard = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const statistics = [
    { id: 1, title: "Vehicle\nOwners", value: "22 000", icon: "car-outline" },
    {
      id: 2,
      title: "Parking\nInspectors",
      value: "9000",
      icon: "reader-outline",
    },
    {
      id: 3,
      title: "Municipal\nOfficers",
      value: "995",
      icon: "people-outline",
    },
    {
      id: 4,
      title: "Parking\nZones",
      value: "7 000",
      icon: "location-outline",
    },
  ];

  const managementOptions = [
    {
      id: "ownerManage",
      title: "Vehicle owner\nManagement",
      icon: "car-outline",
    },
    {
      id: "parkinginspector",
      title: "Parking Inspector\nManagement",
      icon: "reader-outline",
    },
    {
      id: "municipalofficer",
      title: "Municipal Council\nOfficer Management",
      icon: "people-outline",
    },
  ];

  const handleManagementPress = (optionId: string) => {
    console.log(`Selected: ${optionId}`);
    // Route to the appropriate management screen
    if (optionId === "ownerManage") {
      router.push("/screens/systemAdmin/dashboard/ownerManage");
    } else if (optionId === "parkinginspector") {
      router.push("/screens/systemAdmin/dashboard/inspectorManage");
    } else if (optionId === "municipalofficer") {
      router.push("/screens/systemAdmin/dashboard/mcOfficerManage");
    } else {
      // For other options, you can add specific routes as they're implemented
      router.push(`/screens/systemAdmin/dashboard/${optionId}` as any);
    }
  };

  const handleBack = () => {
    router.replace("/loginSelection");
  };

  return (
    <View style={styles.container}>
      {/* Top Safe Area Background */}
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <StatusBar barStyle="light-content" />

        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 10 }]}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 60 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Title */}
          <Text style={styles.headerTitle}>Admin Dashboard</Text>

          {/* Statistics Cards */}
          <View style={styles.statsContainer}>
            {statistics.map((stat) => (
              <View key={stat.id} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
                <View style={styles.statIconContainer}>
                  <Ionicons name={stat.icon as any} size={20} color="#4A8B6F" />
                </View>
              </View>
            ))}
          </View>

          {/* System Management Section */}
          <View style={styles.managementSection}>
            <Text style={styles.sectionTitle}>System Management</Text>

            <View style={styles.managementGrid}>
              {managementOptions.map((option, index) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.managementButton}
                  onPress={() => handleManagementPress(option.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.managementIconContainer}>
                    <Ionicons
                      name={option.icon as any}
                      size={24}
                      color="#FFFFFF"
                    />
                  </View>
                  <Text style={styles.managementTitle}>{option.title}</Text>
                </TouchableOpacity>
              ))}
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
    backgroundColor: "transparent",
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
  },
  backButton: {
    position: "absolute",
    left: 10,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: "relative",
    minHeight: 80,
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: "#000000",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 11,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    lineHeight: 14,
  },
  statIconContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(147, 197, 168, 0.3)",
    borderRadius: 16,
    padding: 6,
  },
  managementSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#555555",
    marginBottom: 16,
  },
  managementGrid: {
    gap: 12,
  },
  managementButton: {
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    backgroundColor: "#093F86",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 14,
  },
  managementGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#093F86",
    gap: 14,
  },
  managementIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  managementTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#FFFFFF",
    lineHeight: 18,
  },
});

export default SysAdminDashboard;
