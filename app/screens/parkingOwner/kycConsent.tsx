import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const KycConsent = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [consentGiven, setConsentGiven] = useState(false);

  const handleAccept = () => {
    // Navigate to KYC Data Confirmation screen
    router.push({
      pathname: "/screens/parkingOwner/kycDataConfirmation",
      params: {
        nicNumber: params.nicNumber,
        fullName: params.fullName,
        address: params.address,
        dateOfBirth: params.dateOfBirth || "",
        gender: params.gender || "",
        mobileNumber: params.mobileNumber,
        email: params.email || "",
        role: params.role,
        transactionId: params.transactionId,
      },
    });
  };

  const handleDecline = () => {
    // Go back to registration
    router.replace("/screens/parkingOwner/signUp");
  };

  return (
    <View style={styles.container}>
      {/* Top Safe Area Background */}
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <StatusBar barStyle="dark-content" />

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
              <Ionicons name="document-text" size={60} color="#093F86" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>KYC Consent</Text>

          {/* Content Card */}
          <View style={styles.contentCard}>
            <Text style={styles.sectionTitle}>
              We need to fetch your verified information from NIC
            </Text>

            <Text style={styles.description}>
              By providing your consent, you agree to allow us to access and
              verify your National Identity Card (NIC) information for KYC
              purposes.
            </Text>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#093F86" />
              <Text style={styles.infoText}>
                We will only use your data for identity verification and account
                setup. Your privacy is our priority.
              </Text>
            </View>

            {/* Consent Checkbox */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setConsentGiven(!consentGiven)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  consentGiven && styles.checkboxChecked,
                ]}
              >
                {consentGiven && (
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>I consent to share data</Text>
            </TouchableOpacity>

            {/* Data Points */}
            <View style={styles.dataPointsContainer}>
              <Text style={styles.dataPointsTitle}>
                Information we will access:
              </Text>

              <View style={styles.dataPoint}>
                <Ionicons name="person-outline" size={18} color="#666" />
                <Text style={styles.dataPointText}>Full Name</Text>
              </View>

              <View style={styles.dataPoint}>
                <Ionicons name="card-outline" size={18} color="#666" />
                <Text style={styles.dataPointText}>NIC Number</Text>
              </View>

              <View style={styles.dataPoint}>
                <Ionicons name="call-outline" size={18} color="#666" />
                <Text style={styles.dataPointText}>Phone Number</Text>
              </View>

              <View style={styles.dataPoint}>
                <Ionicons name="location-outline" size={18} color="#666" />
                <Text style={styles.dataPointText}>Date of Birth</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={handleDecline}
              activeOpacity={0.8}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.acceptButton,
                !consentGiven && styles.acceptButtonDisabled,
              ]}
              onPress={handleAccept}
              activeOpacity={0.8}
              disabled={!consentGiven}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
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
    backgroundColor: "#F5F5F5",
  },
  topSafeArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 24,
  },
  contentCard: {
    backgroundColor: "#FFFFFF",
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
    marginBottom: 12,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    lineHeight: 22,
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#093F86",
    lineHeight: 18,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#D0D0D0",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#093F86",
    borderColor: "#093F86",
  },
  checkboxLabel: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#000000",
  },
  dataPointsContainer: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 16,
  },
  dataPointsTitle: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    color: "#333333",
    marginBottom: 12,
  },
  dataPoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  dataPointText: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#666666",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  declineButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#DC143C",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
  },
  declineButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#DC143C",
  },
  acceptButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  acceptButtonDisabled: {
    backgroundColor: "#B0BEC5",
    opacity: 0.6,
  },
  acceptButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
});

export default KycConsent;
