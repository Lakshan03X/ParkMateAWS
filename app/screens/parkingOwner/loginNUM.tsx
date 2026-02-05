import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import awsDynamoService from "../../services/awsDynamoService";
import awsDemoService from "../../services/awsDemoService";

const LoginNUM = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [mobileNumber, setMobileNumber] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [mobileError, setMobileError] = useState("");

  // Validate mobile number format
  const validateMobileNumber = (mobile: string): boolean => {
    // Sri Lankan mobile number validation (10 digits starting with 0)
    const mobileRegex = /^0[0-9]{9}$/;
    if (!mobileRegex.test(mobile)) {
      setMobileError("Enter a valid 10-digit mobile number (e.g., 0771234567)");
      return false;
    }
    setMobileError("");
    return true;
  };

  const handleSendOTP = async () => {
    // Validate mobile number format
    if (!validateMobileNumber(mobileNumber)) {
      return;
    }

    setIsChecking(true);

    try {
      // Check if mobile number is registered in the system
      // Check if mobile number is registered in the system
      // Scan users table and filter by mobile number
      const result = await awsDynamoService.scan("parkmate-users");
      const users = result.items || [];
      const user = users.find((u: any) => u.mobileNumber === mobileNumber);

      if (!user) {
        Alert.alert(
          "Mobile Number Not Registered",
          "This mobile number is not registered in our system. Please sign up first.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Sign Up",
              onPress: () => router.replace("/screens/parkingOwner/signUp"),
            },
          ],
        );
        setIsChecking(false);
        return;
      }

      const userData = user;
      const userId = user.id || user.userId || user.docId; // Assuming id might be in different fields

      // Show confirmation
      Alert.alert(
        "Confirm Mobile Number",
        `We will send an OTP to:\n${mobileNumber}\n\nIs this correct?`,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setIsChecking(false),
          },
          {
            text: "Send OTP",
            onPress: async () => {
              try {
                // Request OTP
                const otpResult = await awsDemoService.requestOTP(
                  userData.nicNumber || "",
                  mobileNumber,
                );

                if (otpResult.status === "success") {
                  // Navigate to OTP verification for login
                  router.push({
                    pathname: "/screens/parkingOwner/loginOTPVerify",
                    params: {
                      transactionId: otpResult.transactionId,
                      nicNumber: userData.nicNumber || "",
                      userId: userId,
                      fullName: userData.fullName,
                      mobileNumber: mobileNumber,
                      maskedNumber: mobileNumber,
                    },
                  });
                } else {
                  Alert.alert("Error", "Failed to send OTP. Please try again.");
                }
              } catch (error: any) {
                Alert.alert("Error", error.message || "Failed to send OTP");
              } finally {
                setIsChecking(false);
              }
            },
          },
        ],
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "An unexpected error occurred");
      setIsChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Safe Area Background */}
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <StatusBar barStyle="dark-content" />

        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 10 }]}
          onPress={() => router.replace("/screens/parkingOwner/signIn")}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#093F86" />
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: insets.top + 60 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Car Illustration */}
            <View style={styles.illustrationContainer}>
              <Image
                source={require("../../../assets/appImages/vehicleOwnerLoginSelection.png")}
                style={{ width: 240, height: 240 }}
                resizeMode="contain"
              />
            </View>

            {/* Title */}
            <Text style={styles.title}>Vehicle Owner Log in</Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>Please enter your mobile number</Text>

            {/* Mobile Number Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  mobileError &&
                    mobileNumber.length === 10 &&
                    styles.inputError,
                ]}
                placeholder="07XXXXXXXX"
                placeholderTextColor="#999"
                value={mobileNumber}
                onChangeText={(text) => {
                  setMobileNumber(text);
                  if (text.length === 10) {
                    validateMobileNumber(text);
                  } else {
                    setMobileError("");
                  }
                }}
                keyboardType="phone-pad"
                maxLength={10}
              />
              {mobileError && mobileNumber.length === 10 && (
                <Text style={styles.errorText}>{mobileError}</Text>
              )}
              {mobileNumber.length > 0 && mobileNumber.length < 10 && (
                <Text style={styles.hintText}>
                  Enter {10 - mobileNumber.length} more digit
                  {10 - mobileNumber.length > 1 ? "s" : ""}
                </Text>
              )}
            </View>

            {/* Send OTP Button */}
            <TouchableOpacity
              style={[
                styles.sendOtpButton,
                (isChecking || mobileNumber.length !== 10 || mobileError) &&
                  styles.sendOtpButtonDisabled,
              ]}
              onPress={handleSendOTP}
              activeOpacity={0.8}
              disabled={
                isChecking || mobileNumber.length !== 10 || !!mobileError
              }
            >
              {isChecking ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.sendOtpButtonText}>Send OTP</Text>
              )}
            </TouchableOpacity>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#093F86" />
              <Text style={styles.infoText}>
                An OTP will be sent to your registered mobile number
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  illustrationContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  illustrationPlaceholder: {
    width: 200,
    height: 180,
    backgroundColor: "#E3F2FD",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  peopleContainer: {
    flexDirection: "row",
    position: "absolute",
    top: 40,
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    textAlign: "center",
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#D0D0D0",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
    fontFamily: "Poppins-Medium",
    color: "#000000",
    textAlign: "center",
    letterSpacing: 1,
  },
  inputError: {
    borderColor: "#F44336",
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#F44336",
    marginTop: 8,
    textAlign: "center",
  },
  hintText: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    marginTop: 8,
    textAlign: "center",
  },
  sendOtpButton: {
    backgroundColor: "#093F86",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 24,
  },
  sendOtpButtonDisabled: {
    backgroundColor: "#B0BEC5",
    opacity: 0.6,
  },
  sendOtpButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#093F86",
    lineHeight: 20,
  },
  demoInfoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF3E0",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  demoInfoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#E65100",
    lineHeight: 18,
  },
  boldText: {
    fontFamily: "Poppins-SemiBold",
  },
});

export default LoginNUM;
