import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import fineCheckerService from "../../services/fineCheckerService";

const FineCheckerDashboard = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [isOn, setIsOn] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Load initial status from params or fetch from Firebase
  useEffect(() => {
    if (params.status) {
      setIsOn(params.status === "onDuty");
    }
  }, [params.status]);

  const handleToggle = async () => {
    if (isUpdating) return; // Prevent multiple clicks

    const newStatus = !isOn;
    const statusValue = newStatus ? "onDuty" : "offDuty";

    // Optimistically update UI
    setIsOn(newStatus);
    setIsUpdating(true);

    try {
      // Update status in Firebase
      const result = await fineCheckerService.updateFineCheckerStatus(
        params.checkerId as string,
        statusValue
      );

      if (result.status === "success") {
        console.log(`✅ Status updated to ${statusValue}`);
      } else {
        // Revert on error
        setIsOn(!newStatus);
        Alert.alert("Error", result.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating duty status:", error);
      // Revert on error
      setIsOn(!newStatus);
      Alert.alert("Error", "Failed to update duty status. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProfileNavigation = () => {
    router.push({
      pathname: "/screens/fineChecker/checkerProfile",
      params: {
        checkerId: params.checkerId,
        checkerName: params.checkerName,
        email: params.email,
        municipalCouncil: params.municipalCouncil,
        employeeId: params.employeeId,
        mobileNumber: params.mobileNumber,
        status: params.status,
      },
    });
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
          onPress={() => router.replace("/screens/fineChecker/checkerLogin")}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Profile Button */}
        <TouchableOpacity
          style={[styles.profileButton, { top: insets.top + 10 }]}
          onPress={handleProfileNavigation}
          activeOpacity={0.7}
        >
          <Ionicons name="person-circle-outline" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 60 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Toggle Switch Section */}
          <View style={styles.toggleSection}>
            <TouchableOpacity
              style={[styles.toggleButton, isOn && styles.toggleButtonOn]}
              onPress={handleToggle}
              activeOpacity={0.8}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                  style={styles.toggleLoader}
                />
              ) : (
                <>
                  <View
                    style={[styles.toggleCircle, isOn && styles.toggleCircleOn]}
                  />
                  <Text style={styles.toggleText}>{isOn ? "On" : "Off"}</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.dutyStatusText}>
              {isOn ? "On Duty" : "Off Duty"}
            </Text>
          </View>

          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <Image
              source={require("../../../assets/appImages/checkerLogin.png")}
              style={{ width: 280, height: 230 }}
              resizeMode="contain"
            />
          </View>

          {/* Home Label */}
          <Text style={styles.homeLabel}>Home</Text>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {/* Today's Activity Button */}
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.8}
              onPress={() => {
                // Navigate to Today's Activity screen
                console.log("Navigate to Today's Activity");
                router.push("/screens/fineChecker/checkerActivity");
              }}
            >
              <Text style={styles.actionButtonText}>Today's Activity</Text>
            </TouchableOpacity>

            {/* History Button */}
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.8}
              onPress={() => {
                // Navigate to History screen
                router.push("/screens/fineChecker/checkerHistory");
                console.log("Navigate to History");
              }}
            >
              <Text style={styles.actionButtonText}>History</Text>
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
  backButton: {
    position: "absolute",
    left: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  profileButton: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  toggleSection: {
    alignItems: "flex-start",
    marginBottom: 30,
  },
  toggleButton: {
    width: 80,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    position: "relative",
  },
  toggleButtonOn: {
    backgroundColor: "#4CAF50",
  },
  toggleCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    position: "absolute",
    left: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  toggleCircleOn: {
    left: 45,
  },
  toggleText: {
    fontSize: 12,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    position: "absolute",
    right: 12,
  },
  toggleLoader: {
    position: "absolute",
    left: "50%",
    marginLeft: -10,
  },
  dutyStatusText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#666666",
    marginTop: 8,
    marginLeft: 8,
  },
  illustrationContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  illustrationBox: {
    width: "100%",
    height: 250,
    backgroundColor: "#81C784",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    paddingHorizontal: 20,
  },
  carContainer: {
    position: "absolute",
    left: 40,
    top: "50%",
    marginTop: -40,
  },
  officerContainer: {
    position: "absolute",
    right: 50,
    top: "50%",
    marginTop: -30,
    alignItems: "center",
  },
  officerDetails: {
    flexDirection: "row",
    gap: 8,
    marginTop: 5,
  },
  badge: {
    width: 15,
    height: 20,
    backgroundColor: "#FFD700",
    borderRadius: 3,
  },
  clipboard: {
    width: 20,
    height: 25,
    backgroundColor: "#FFFFFF",
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "#424242",
  },
  homeLabel: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 30,
  },
  buttonContainer: {
    gap: 20,
  },
  actionButton: {
    backgroundColor: "#093F86",
    borderRadius: 10,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
});

export default FineCheckerDashboard;
