import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import firebaseDemoService from "./services/firebaseDemoService";

const OtpVerify = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(120); // 2 minutes in seconds
  const [isError, setIsError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      // Auto resend OTP when timer reaches 0
      handleResendOtp();
    }
  }, [timer]);

  // Format timer display (MM:SS)
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Handle OTP input change
  const handleOtpChange = (value: string, index: number) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setIsError(false);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Shake animation for error
  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Verify OTP
  const handleConfirm = async () => {
    const enteredOtp = otp.join("");

    if (enteredOtp.length !== 4) {
      return;
    }

    setIsVerifying(true);

    try {
      // Verify OTP with the transaction ID
      const result = await firebaseDemoService.verifyOTP(
        params.transactionId as string,
        enteredOtp
      );

      if (result.status === "success" && result.verified) {
        console.log("✅ OTP verified successfully!");

        // Fetch the full NIC data including DOB and gender
        const nicData = await firebaseDemoService.verifyNIC(
          params.nicNumber as string
        );

        // Navigate to KYC Consent with complete registration data including DOB
        router.replace({
          pathname: "/screens/parkingOwner/kycConsent",
          params: {
            transactionId: params.transactionId,
            nicNumber: params.nicNumber,
            fullName: params.fullName,
            address: params.address,
            dateOfBirth: nicData.data?.dateOfBirth || "",
            gender: nicData.data?.gender || "",
            mobileNumber: params.mobileNumber,
            email: params.email || "",
            role: params.role || "parkingOwner",
          },
        });
      } else {
        // OTP is incorrect
        setIsError(true);
        triggerShake();
        Alert.alert("Invalid OTP", result.message || "Please try again");

        // Auto resend OTP and reset after 2 seconds
        setTimeout(() => {
          handleResendOtp();
        }, 2000);
      }
    } catch (error: any) {
      setIsError(true);
      triggerShake();
      Alert.alert("Error", error.message || "Failed to verify OTP");
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    console.log("Resending OTP...");
    try {
      const result = await firebaseDemoService.requestOTP(
        params.nicNumber as string,
        params.mobileNumber as string
      );

      if (result.status === "success") {
        Alert.alert("OTP Resent", "A new OTP has been sent to your mobile");
      }
    } catch (error) {
      console.error("Failed to resend OTP:", error);
    }

    setOtp(["", "", "", ""]);
    setTimer(120); // Reset timer to 2 minutes
    setIsError(false);
    inputRefs.current[0]?.focus();
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
          onPress={() => router.replace("/loginSelection")}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: insets.top + 60 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Car Illustration */}
            <View style={styles.illustrationContainer}>
              <View style={styles.illustrationPlaceholder}>
                <Ionicons name="car-sport" size={80} color="#093F86" />
                <View style={styles.peopleContainer}>
                  <Ionicons name="person" size={20} color="#333" />
                  <Ionicons name="person" size={20} color="#333" />
                  <Ionicons name="person" size={20} color="#333" />
                </View>
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>Verification Code</Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              We have sent the OTP{"\n"}code to your mobile number
            </Text>

            {/* OTP Input Container */}
            <Animated.View
              style={[
                styles.otpContainer,
                { transform: [{ translateX: shakeAnimation }] },
              ]}
            >
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.otpInput,
                    isError && styles.otpInputError,
                    digit && styles.otpInputFilled,
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!isVerifying}
                />
              ))}
            </Animated.View>

            {/* Timer */}
            <Text style={styles.timer}>{formatTimer(timer)}</Text>

            {/* Error Message */}
            {isError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Invalid code. Try Again ?</Text>
                <Text style={styles.errorSubtext}>
                  OTP will be resent automatically
                </Text>
              </View>
            )}

            {/* Confirm Button */}
            <TouchableOpacity
              style={[
                styles.confirmButton,
                (isVerifying || otp.some((d) => !d)) &&
                  styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              activeOpacity={0.8}
              disabled={isVerifying || otp.some((d) => !d)}
            >
              <Text style={styles.confirmButtonText}>
                {isVerifying ? "Verifying..." : "Confirm"}
              </Text>
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
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  illustrationContainer: {
    alignItems: "center",
    marginBottom: 32,
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
    fontSize: 24,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 22,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 16,
  },
  otpInput: {
    width: 60,
    height: 70,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#D0D0D0",
    borderRadius: 12,
    fontSize: 32,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    textAlign: "center",
  },
  otpInputFilled: {
    borderColor: "#093F86",
    backgroundColor: "#F0F7FF",
  },
  otpInputError: {
    borderColor: "#DC143C",
    backgroundColor: "#FFE6E6",
  },
  timer: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#093F86",
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: "#DC143C",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginBottom: 32,
    alignItems: "center",
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  errorSubtext: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 4,
  },
  confirmButton: {
    backgroundColor: "#093F86",
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 80,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  confirmButtonDisabled: {
    backgroundColor: "#A0A0A0",
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: "center",
  },
});

export default OtpVerify;
