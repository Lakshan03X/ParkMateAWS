import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import inspectorService from "../../services/inspectorService";
import awsDemoService from "../../services/awsDemoService";

const InspectorLogin = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [employeeId, setEmployeeId] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSendOTP = async () => {
    if (!employeeId.trim()) {
      Alert.alert("Validation Error", "Please enter your Employee ID");
      return;
    }
    if (!mobileNumber.trim()) {
      Alert.alert("Validation Error", "Please enter your mobile number");
      return;
    }

    try {
      setIsVerifying(true);

      // Verify inspector credentials in AWS DynamoDB
      console.log("🔍 Verifying inspector credentials...");
      const verificationResult = await inspectorService.verifyInspectorLogin(
        employeeId,
        mobileNumber
      );

      if (
        verificationResult.status === "success" &&
        verificationResult.inspector
      ) {
        console.log("✅ Inspector verified successfully");

        // Store inspector data for use in callback
        const inspector = verificationResult.inspector;

        // Send OTP
        const otpResult = await awsDemoService.requestOTP(
          employeeId, // Using employeeId as identifier
          mobileNumber
        );

        if (otpResult.status === "success") {
          Alert.alert(
            "OTP Sent",
            "An OTP has been sent to your mobile number. Use 1234 for testing.",
            [
              {
                text: "OK",
                onPress: () => {
                  // Navigate to OTP verification with inspector data
                  router.push({
                    pathname: "/screens/parkingInspector/inspectorOtpVerify",
                    params: {
                      transactionId: otpResult.transactionId,
                      employeeId: employeeId,
                      inspectorId: inspector.id,
                      inspectorName: inspector.name,
                      mobileNumber: mobileNumber,
                      inspectorStatus: inspector.status,
                    },
                  });
                },
              },
            ]
          );
        } else {
          Alert.alert("Error", otpResult.message || "Failed to send OTP");
        }
      } else {
        Alert.alert(
          "Login Failed",
          verificationResult.message || "Invalid credentials"
        );
      }
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert("Error", error.message || "Failed to verify credentials");
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
          onPress={() => router.replace("/loginSelection")}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: insets.top + 60 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Illustration Section */}
            <View style={styles.illustrationContainer}>
              <Image
                source={require("../../../assets/appImages/inspectorLogin.png")}
                style={{ width: 280, height: 280 }}
                resizeMode="contain"
              />
            </View>

            {/* Title Section */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Parking Inspector Log in</Text>
              <Text style={styles.subtitle}>
                Access your Inspector dashboard
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              {/* Employee ID Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Employee Id</Text>
                <TextInput
                  style={styles.input}
                  placeholder="INS XXX"
                  placeholderTextColor="#999"
                  value={employeeId}
                  onChangeText={setEmployeeId}
                  autoCapitalize="characters"
                  editable={!isVerifying}
                />
              </View>

              {/* Mobile Number Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mobile Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="07X XXX XXXX"
                  placeholderTextColor="#999"
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  keyboardType="phone-pad"
                  maxLength={15}
                  editable={!isVerifying}
                />
              </View>
            </View>

            {/* Send OTP Button */}
            <TouchableOpacity
              style={[
                styles.sendButton,
                isVerifying && styles.sendButtonDisabled,
              ]}
              onPress={handleSendOTP}
              activeOpacity={0.8}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.sendButtonText}>Send OTP</Text>
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
  keyboardView: {
    flex: 1,
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
    width: 200,
    height: 160,
    backgroundColor: "#E3F2FD",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  personIcon: {
    position: "absolute",
    right: 40,
    bottom: 35,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 22,
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
  sendButton: {
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
  sendButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  sendButtonDisabled: {
    backgroundColor: "#A0A0A0",
    opacity: 0.6,
  },
});

export default InspectorLogin;
