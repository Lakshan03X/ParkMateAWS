import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import awsDemoService from "../../services/awsDemoService";

const RegisterNUM = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateInputs = () => {
    // Validate full name
    if (!fullName.trim()) {
      Alert.alert("Validation Error", "Please enter your full name");
      return false;
    }

    if (fullName.trim().length < 3) {
      Alert.alert(
        "Validation Error",
        "Full name must be at least 3 characters"
      );
      return false;
    }

    // Validate mobile number
    if (!mobileNumber.trim()) {
      Alert.alert("Validation Error", "Please enter your mobile number");
      return false;
    }

    // Sri Lankan mobile number validation (10 digits starting with 0)
    const mobileRegex = /^0[0-9]{9}$/;
    if (!mobileRegex.test(mobileNumber.trim())) {
      Alert.alert(
        "Validation Error",
        "Please enter a valid 10-digit mobile number (e.g., 0771234567)"
      );
      return false;
    }

    // Validate email if provided
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        Alert.alert("Validation Error", "Please enter a valid email address");
        return false;
      }
    }

    return true;
  };

  const handleRegister = async () => {
    // Validate inputs
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);

    try {
      // Request OTP
      const otpResult = await awsDemoService.requestOTP(
        "", // No NIC for mobile registration
        mobileNumber.trim()
      );

      if (otpResult.status === "success" && otpResult.transactionId) {
        console.log("✅ OTP sent successfully");

        Alert.alert(
          "OTP Sent",
          "A verification code has been sent to your mobile number. Use 1234 for testing.",
          [
            {
              text: "OK",
              onPress: () => {
                // Navigate to OTP verification screen with registration data
                router.replace({
                  pathname: "/otpVerifyNumber",
                  params: {
                    transactionId: otpResult.transactionId,
                    fullName: fullName.trim(),
                    mobileNumber: mobileNumber.trim(),
                    email: email.trim(),
                    registrationType: "mobile",
                    role: "parkingOwner",
                  },
                });
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", otpResult.message || "Failed to send OTP");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to send OTP. Please try again."
      );
    } finally {
      setIsLoading(false);
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
          onPress={() => router.replace("/screens/parkingOwner/signUp")}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
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
            <Text style={styles.title}>Sign Up with Mobile Number</Text>

            {/* Form Container */}
            <View style={styles.formContainer}>
              {/* Full Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#999"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>

              {/* Mobile Number Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mobile Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0771234567"
                  placeholderTextColor="#999"
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  keyboardType="phone-pad"
                  maxLength={10}
                  editable={!isLoading}
                />
              </View>

              {/* Email Input (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Email <Text style={styles.optionalText}>(optional)</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="example@email.com"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[
                styles.registerButton,
                isLoading && styles.registerButtonDisabled,
              ]}
              onPress={handleRegister}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.registerButtonText}>
                  Register with Mobile Number
                </Text>
              )}
            </TouchableOpacity>
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
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  illustrationContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  illustrationPlaceholder: {
    width: 160,
    height: 140,
    backgroundColor: "#E3F2FD",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  peopleContainer: {
    flexDirection: "row",
    position: "absolute",
    top: 30,
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 32,
  },
  formContainer: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#333333",
    marginBottom: 8,
  },
  optionalText: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#666666",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#000000",
  },
  registerButton: {
    backgroundColor: "#093F86",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  registerButtonDisabled: {
    backgroundColor: "#A0A0A0",
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
});

export default RegisterNUM;
