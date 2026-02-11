import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import awsDynamoService from "../../services/awsDynamoService";
import apiService from "../../services/apiService";

const KycConsentMobile = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleConfirm = async () => {
    console.log("🔵 KYC Consent (Mobile) - Starting registration...");
    setIsProcessing(true);

    try {
      console.log("📝 Registering user with mobile data:", {
        fullName: params.fullName,
        mobileNumber: params.mobileNumber,
        role: params.role,
      });

      // Check if mobile number is already registered
      const existingUser = await apiService.getUserByMobileNumber(
        params.mobileNumber as string,
      );

      if (existingUser.status === "success" && existingUser.user) {
        Alert.alert(
          "Mobile Number Already Registered",
          "This mobile number is already registered. Please login with your existing account or use a different number.",
          [
            { text: "OK", style: "cancel" },
            {
              text: "Login",
              onPress: () => router.replace("/screens/parkingOwner/loginNUM"),
            },
          ],
        );
        setIsProcessing(false);
        return;
      }

      // Save user to DynamoDB (without NIC data)
      const userId = `USER_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const userData = {
        userId,
        fullName: params.fullName as string,
        mobileNumber: params.mobileNumber as string,
        email: (params.email as string) || "",
        role: (params.role as string) || "parkingOwner",
        registrationType: "mobile",
        nicNumber: `PENDING_${userId}`, // Unique placeholder for mobile registration (GSI requires non-null value)
        address: "",
        verified: true,
        profileComplete: false, // Flag to show warning icon
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await awsDynamoService.putItem("parkmate-users", userData);
      console.log("✅ User saved to database with ID:", userId);

      // Show success animation
      setShowSuccess(true);

      // Wait for animation then navigate to dashboard
      setTimeout(() => {
        console.log("🚀 Navigating to owner dashboard...");
        router.replace({
          pathname: "/screens/parkingOwner/ownerDashboard",
          params: {
            userId: userId,
            fullName: params.fullName,
            mobileNumber: params.mobileNumber,
            profileComplete: "false", // Pass as string for navigation
          },
        });
      }, 1500);
    } catch (error: any) {
      console.error("💥 Registration error:", error);
      Alert.alert("Error", error.message || "Failed to complete registration");
      setIsProcessing(false);
    }
  };

  if (showSuccess) {
    return (
      <View style={styles.successContainer}>
        <View style={[styles.topSafeArea, { height: insets.top }]} />
        <SafeAreaView style={styles.successSafeArea} edges={["bottom"]}>
          <StatusBar barStyle="light-content" />
          <View style={styles.successContent}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark-circle" size={100} color="#4CAF50" />
            </View>
            <Text style={styles.successTitle}>Success!</Text>
            <Text style={styles.successSubtitle}>
              Congratulations! You have been{"\n"}successfully registered
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Safe Area Background */}
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <StatusBar barStyle="light-content" />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Icon Container */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={60} color="#093F86" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Registration Confirmation</Text>

          {/* Content Card */}
          <View style={styles.contentCard}>
            <Text style={styles.sectionTitle}>
              Please verify your information
            </Text>

            {/* Data Fields */}
            <View style={styles.dataField}>
              <View style={styles.dataFieldHeader}>
                <Ionicons name="person" size={20} color="#093F86" />
                <Text style={styles.dataFieldLabel}>Name:</Text>
              </View>
              <Text style={styles.dataFieldValue}>{params.fullName}</Text>
            </View>

            <View style={styles.dataField}>
              <View style={styles.dataFieldHeader}>
                <Ionicons name="call" size={20} color="#093F86" />
                <Text style={styles.dataFieldLabel}>Phone No:</Text>
              </View>
              <Text style={styles.dataFieldValue}>{params.mobileNumber}</Text>
            </View>

            {params.email && (
              <View style={[styles.dataField, { borderBottomWidth: 0 }]}>
                <View style={styles.dataFieldHeader}>
                  <Ionicons name="mail" size={20} color="#093F86" />
                  <Text style={styles.dataFieldLabel}>Email:</Text>
                </View>
                <Text style={styles.dataFieldValue}>{params.email}</Text>
              </View>
            )}

            {/* Warning Box */}
            <View style={styles.warningBox}>
              <Ionicons name="information-circle" size={20} color="#FF9800" />
              <Text style={styles.warningText}>
                You can add your NIC information later from your profile to
                complete your registration
              </Text>
            </View>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            style={[
              styles.confirmButton,
              isProcessing && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
            activeOpacity={0.8}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm & Continue</Text>
            )}
          </TouchableOpacity>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 20,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 24,
  },
  contentCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    marginBottom: 20,
  },
  dataField: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  dataFieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  dataFieldLabel: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    color: "#666666",
  },
  dataFieldValue: {
    fontSize: 15,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    marginLeft: 28,
  },
  warningBox: {
    flexDirection: "row",
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 10,
    alignItems: "center",
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#E65100",
    lineHeight: 18,
  },
  confirmButton: {
    backgroundColor: "#093F86",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  confirmButtonDisabled: {
    backgroundColor: "#B0BEC5",
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  successContainer: {
    flex: 1,
  },
  successSafeArea: {
    flex: 1,
  },
  successContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  successCircle: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontFamily: "Poppins-Bold",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#E3F2FD",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default KycConsentMobile;
