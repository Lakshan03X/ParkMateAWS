import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
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
import apiService from "../../services/apiService";

const RegisterNIC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [nicNumber, setNicNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [transactionId, setTransactionId] = useState("");

  // Real-time NIC verification with debouncing
  useEffect(() => {
    const verifyNICNumber = async () => {
      // Only verify if NIC number is valid length (12 digits)
      if (nicNumber.length === 12) {
        setIsVerifying(true);
        setVerificationError("");
        setIsVerified(false);
        setFullName("");
        setAddress("");

        try {
          const result = await awsDemoService.verifyNIC(nicNumber);

          if (result.status === "success" && result.data) {
            // Auto-fill the name and address
            setFullName(result.data.fullName);
            setAddress(result.data.address);
            setIsVerified(true);
            setVerificationError("");
          } else {
            setVerificationError(
              "NIC not found. Please use a valid demo NIC below.",
            );
            setIsVerified(false);
          }
        } catch (error) {
          setVerificationError("Failed to verify NIC. Please try again.");
          setIsVerified(false);
        } finally {
          setIsVerifying(false);
        }
      } else {
        // Reset verification state if NIC is incomplete
        setIsVerified(false);
        setVerificationError("");
        setFullName("");
        setAddress("");
      }
    };

    // Debounce the verification
    const timeoutId = setTimeout(() => {
      if (nicNumber.length > 0) {
        verifyNICNumber();
      }
    }, 800); // Wait 800ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [nicNumber]);

  const handleRegister = async () => {
    // Validation
    if (!nicNumber || nicNumber.length !== 12) {
      Alert.alert(
        "Validation Error",
        "Please enter a valid 12-digit NIC number",
      );
      return;
    }

    if (!isVerified) {
      Alert.alert(
        "Verification Required",
        "Please wait for NIC verification to complete",
      );
      return;
    }

    if (!mobileNumber || mobileNumber.length < 10) {
      Alert.alert("Validation Error", "Please enter a valid mobile number");
      return;
    }

    try {
      setIsVerifying(true);

      // Initiate registration with OTP
      const result = await apiService.initiateRegistration(
        nicNumber,
        mobileNumber,
        email,
      );

      if (result.status === "success" && result.transactionId) {
        setTransactionId(result.transactionId);

        // Navigate to OTP verification screen with registration data
        router.push({
          pathname: "/otpVerify",
          params: {
            transactionId: result.transactionId,
            nicNumber: nicNumber,
            fullName: fullName,
            address: address,
            mobileNumber: mobileNumber,
            email: email || "",
            role: "vehicle_owner",
            userType: "vehicle_owner",
          },
        });
      } else {
        Alert.alert(
          "Registration Failed",
          result.message || "Unable to proceed with registration",
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "An unexpected error occurred");
    } finally {
      setIsVerifying(false);
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
            <Text style={styles.title}>Sign Up with Digital NIC</Text>

            {/* Form Container */}
            <View style={styles.formContainer}>
              {/* NIC Number Input with Verification Status */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>NIC Number</Text>
                <View style={styles.inputWithIcon}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.inputWithRightIcon,
                      isVerified && styles.inputVerified,
                      verificationError && styles.inputError,
                    ]}
                    placeholder="Enter your 12-digit NIC number"
                    placeholderTextColor="#999"
                    value={nicNumber}
                    onChangeText={setNicNumber}
                    keyboardType="numeric"
                    maxLength={12}
                  />
                  <View style={styles.inputIconContainer}>
                    {isVerifying && (
                      <ActivityIndicator size="small" color="#093F86" />
                    )}
                    {!isVerifying && isVerified && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#4CAF50"
                      />
                    )}
                    {!isVerifying &&
                      verificationError &&
                      nicNumber.length === 12 && (
                        <Ionicons
                          name="close-circle"
                          size={24}
                          color="#F44336"
                        />
                      )}
                  </View>
                </View>
                {verificationError && nicNumber.length === 12 && (
                  <Text style={styles.errorText}>{verificationError}</Text>
                )}
                {isVerified && (
                  <Text style={styles.successText}>
                    ✓ NIC verified successfully
                  </Text>
                )}
                {nicNumber.length > 0 && nicNumber.length < 12 && (
                  <Text style={styles.hintText}>
                    Enter {12 - nicNumber.length} more digit
                    {12 - nicNumber.length > 1 ? "s" : ""}
                  </Text>
                )}
              </View>

              {/* Full Name Input (Auto-filled) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View
                  style={[
                    styles.disabledInputContainer,
                    isVerified && styles.verifiedInputContainer,
                  ]}
                >
                  <TextInput
                    style={[
                      styles.input,
                      styles.disabledInput,
                      isVerified && styles.verifiedInput,
                    ]}
                    placeholder="Auto-filled after NIC verification — non-editable"
                    placeholderTextColor="#999"
                    value={fullName}
                    editable={false}
                  />
                  {isVerified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="lock-closed" size={12} color="#666" />
                    </View>
                  )}
                </View>
              </View>

              {/* Address Input (Auto-filled) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <View
                  style={[
                    styles.disabledInputContainer,
                    isVerified && styles.verifiedInputContainer,
                  ]}
                >
                  <TextInput
                    style={[
                      styles.input,
                      styles.disabledInput,
                      isVerified && styles.verifiedInput,
                    ]}
                    placeholder="Auto-filled after NIC verification — non-editable"
                    placeholderTextColor="#999"
                    value={address}
                    editable={false}
                    multiline
                  />
                  {isVerified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="lock-closed" size={12} color="#666" />
                    </View>
                  )}
                </View>
              </View>

              {/* Mobile Number Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mobile Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your mobile number"
                  placeholderTextColor="#999"
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>

              {/* Email Input (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Email <Text style={styles.optionalText}>(optional)</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email address"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[
                styles.registerButton,
                (!isVerified || isVerifying) && styles.registerButtonDisabled,
              ]}
              onPress={handleRegister}
              activeOpacity={0.8}
              disabled={!isVerified || isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>Register with NIC</Text>
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
    marginBottom: 24,
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
  inputWithIcon: {
    position: "relative",
  },
  inputWithRightIcon: {
    paddingRight: 48,
  },
  inputIconContainer: {
    position: "absolute",
    right: 12,
    top: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  inputVerified: {
    borderColor: "#4CAF50",
    borderWidth: 2,
  },
  inputError: {
    borderColor: "#F44336",
    borderWidth: 2,
  },
  disabledInputContainer: {
    opacity: 0.6,
    position: "relative",
  },
  verifiedInputContainer: {
    opacity: 1,
  },
  disabledInput: {
    backgroundColor: "#F5F5F5",
    color: "#666666",
  },
  verifiedInput: {
    backgroundColor: "#E8F5E9",
    color: "#000000",
    fontFamily: "Poppins-Medium",
  },
  verifiedBadge: {
    position: "absolute",
    right: 12,
    top: 14,
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#F44336",
    marginTop: 4,
  },
  successText: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    color: "#4CAF50",
    marginTop: 4,
  },
  hintText: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    marginTop: 4,
  },
  demoInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  demoInfoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#093F86",
  },
  registerButton: {
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
  registerButtonDisabled: {
    backgroundColor: "#B0BEC5",
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
});

export default RegisterNIC;
