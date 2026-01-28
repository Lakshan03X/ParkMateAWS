import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Switch,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import inspectorService from "../../services/inspectorService";

const InspectorDash = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [isOnline, setIsOnline] = useState(params.inspectorStatus === "online");
  const [inspectorName, setInspectorName] = useState(
    params.inspectorName as string
  );
  const [employeeId, setEmployeeId] = useState(params.employeeId as string);

  // Update Firebase when status changes
  useEffect(() => {
    updateStatusInFirebase();
  }, [isOnline]);

  const updateStatusInFirebase = async () => {
    try {
      const status = isOnline ? "online" : "offline";
      console.log(`📡 Updating inspector status to ${status}...`);

      const result = await inspectorService.updateInspectorStatus(
        params.inspectorId as string,
        status
      );

      if (result.status === "success") {
        console.log(`✅ Status updated successfully to ${status}`);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleToggleStatus = (value: boolean) => {
    setIsOnline(value);
    const statusText = value ? "Online" : "Offline";
    Alert.alert(
      "Status Updated",
      `You are now ${statusText}. Your status has been updated in the system.`
    );
  };

  const handleProfilePress = () => {
    router.push({
      pathname: "/screens/parkingInspector/InspectorProfile",
      params: {
        inspectorId: params.inspectorId,
        inspectorName: inspectorName,
        employeeId: employeeId,
        mobileNumber: params.mobileNumber,
        email: params.email || "",
        municipalCouncil: params.municipalCouncil || "Colombo",
      },
    });
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: async () => {
          // Set status to offline before logout
          try {
            await inspectorService.updateInspectorStatus(
              params.inspectorId as string,
              "offline"
            );
          } catch (error) {
            console.error("Failed to update status on logout:", error);
          }
          router.replace("/loginSelection");
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Top Safe Area Background */}
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#C8E6C9" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={handleProfilePress}
            activeOpacity={0.7}
          >
            <View style={styles.profileCircle}>
              <Ionicons name="person" size={28} color="#4CAF50" />
            </View>
          </TouchableOpacity>

          <View
            style={[
              styles.statusToggle,
              { backgroundColor: isOnline ? "#4CAF50" : "#F44336" },
            ]}
          >
            <Text style={styles.statusText}>{isOnline ? "On" : "Off"}</Text>
            <Switch
              value={isOnline}
              onValueChange={handleToggleStatus}
              trackColor={{ false: "#C62828", true: "#2E7D32" }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#C62828"
            />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <Image
              source={require("../../../assets/appImages/inspectorLogin.png")}
              style={{ width: 350, height: 230 }}
              resizeMode="contain"
            />
          </View>

          {/* Home Title */}
          <Text style={styles.homeTitle}>Home</Text>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.scanButton]}
              onPress={() => {
                if (!isOnline) {
                  Alert.alert(
                    "Status Offline",
                    "Please go online to scan number plates."
                  );
                  return;
                }
                router.push({
                  pathname: "/screens/parkingInspector/inspectorScanPlate",
                  params: {
                    inspectorId: params.inspectorId,
                    inspectorName: inspectorName,
                    employeeId: employeeId,
                  },
                });
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>
                Scan the number{"\n"}plate and check
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.activityButton]}
              onPress={() => {
                router.push({
                  pathname: "/screens/parkingInspector/inspectorActivity",
                  params: { inspectorId: params.inspectorId },
                });
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>Today's Activity</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.historyButton]}
              onPress={() => {
                router.push({
                  pathname: "/screens/parkingInspector/inspectorHistory",
                  params: { inspectorId: params.inspectorId },
                });
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>History</Text>
            </TouchableOpacity>
            {/* ............................................................ */}
            <TouchableOpacity
              style={[styles.actionButton, styles.historyButton]}
              onPress={() => {
                router.push("/screens/parkingInspector/manageFineChecker");
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>Fine Checker Manage</Text>
            </TouchableOpacity>
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
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    backgroundColor: "transparent",
    paddingHorizontal: 20,
    paddingVertical: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profileButton: {
    padding: 4,
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statusToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statusText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  illustrationContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  illustrationCard: {
    width: "100%",
    height: 180,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    overflow: "hidden",
  },
  carContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  carBody: {
    position: "relative",
  },
  carPart: {
    borderRadius: 8,
  },
  carRoof: {
    width: 60,
    height: 30,
    backgroundColor: "#7B68EE",
    marginLeft: 15,
    marginBottom: -5,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  carMain: {
    width: 90,
    height: 40,
    backgroundColor: "#7B68EE",
    borderRadius: 10,
  },
  peopleRow: {
    flexDirection: "row",
    gap: 16,
    position: "absolute",
    top: 70,
  },
  personCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  homeTitle: {
    fontSize: 26,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    marginBottom: 24,
    textAlign: "center",
  },
  actionButtonsContainer: {
    gap: 16,
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 85,
  },
  scanButton: {
    backgroundColor: "#093F86",
  },
  activityButton: {
    backgroundColor: "#093F86",
  },
  historyButton: {
    backgroundColor: "#093F86",
  },
  actionButtonText: {
    fontSize: 17,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default InspectorDash;
