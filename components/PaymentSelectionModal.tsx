import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

interface PaymentSelectionModalProps {
  visible: boolean;
  amount: number;
  description: string;
  onClose: () => void;
  onPaymentMethodSelected: (
    method: "stripe" | "paypal" | "payoneer",
    phoneNumber?: string,
  ) => void;
}

const PaymentSelectionModal: React.FC<PaymentSelectionModalProps> = ({
  visible,
  amount,
  description,
  onClose,
  onPaymentMethodSelected,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<
    "stripe" | "paypal" | "payoneer" | null
  >(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const paymentMethods = [
    {
      id: "stripe" as const,
      name: "Credit/Debit Card",
      icon: "card-outline",
      description: "Pay with Visa, Mastercard, Amex",
      color: "#635BFF",
    },
    {
      id: "paypal" as const,
      name: "PayPal",
      icon: "logo-paypal",
      description: "Pay with your PayPal account",
      color: "#0070BA",
    },
    {
      id: "payoneer" as const,
      name: "Payoneer",
      icon: "wallet-outline",
      description: "Pay with Payoneer",
      color: "#FF6C00",
    },
  ];

  const handleMethodSelect = (method: "stripe" | "paypal" | "payoneer") => {
    setSelectedMethod(method);

    if (method === "stripe") {
      // For Stripe, show phone number input for OTP verification
      setShowOtpInput(true);
    } else {
      // For PayPal and Payoneer, directly proceed (demo mode)
      handleDemoPayment(method);
    }
  };

  const handleDemoPayment = async (method: "paypal" | "payoneer") => {
    try {
      setIsProcessing(true);

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate mock payment ID
      const paymentId = `${method}_${Math.random().toString(36).substr(2, 9)}`;

      Alert.alert(
        "Payment Successful",
        `Your payment via ${
          method === "paypal" ? "PayPal" : "Payoneer"
        } was successful!`,
        [
          {
            text: "Continue",
            onPress: () => {
              onPaymentMethodSelected(method);
              resetForm();
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert("Payment Failed", "Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert("Invalid Phone", "Please enter a valid phone number");
      return;
    }

    try {
      setIsProcessing(true);

      // Simulate OTP sending
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setOtpSent(true);
      Alert.alert("OTP Sent", `Verification code sent to ${phoneNumber}`);
    } catch (error) {
      Alert.alert("Error", "Failed to send OTP. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert("Invalid OTP", "Please enter the 6-digit code");
      return;
    }

    try {
      setIsProcessing(true);

      // Simulate OTP verification
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // For demo: any 6-digit code works
      Alert.alert(
        "Phone Verified",
        "Your phone number has been verified successfully!",
        [
          {
            text: "Continue to Payment",
            onPress: () => {
              onPaymentMethodSelected("stripe", phoneNumber);
              resetForm();
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert("Verification Failed", "Invalid OTP. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setSelectedMethod(null);
    setPhoneNumber("");
    setOtp("");
    setShowOtpInput(false);
    setOtpSent(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Select Payment Method</Text>
              <TouchableOpacity onPress={handleClose} disabled={isProcessing}>
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Amount Display */}
              <View style={styles.amountCard}>
                <Text style={styles.amountLabel}>Amount to Pay</Text>
                <Text style={styles.amountValue}>
                  Rs. {amount.toLocaleString()}
                </Text>
                <Text style={styles.descriptionText}>{description}</Text>
              </View>

              {!showOtpInput ? (
                // Payment Method Selection
                <View style={styles.methodsContainer}>
                  {paymentMethods.map((method) => (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        styles.methodCard,
                        selectedMethod === method.id &&
                          styles.methodCardSelected,
                      ]}
                      onPress={() => handleMethodSelect(method.id)}
                      disabled={isProcessing}
                    >
                      <View style={styles.methodIcon}>
                        <Ionicons
                          name={method.icon as any}
                          size={32}
                          color={method.color}
                        />
                      </View>
                      <View style={styles.methodInfo}>
                        <Text style={styles.methodName}>{method.name}</Text>
                        <Text style={styles.methodDescription}>
                          {method.description}
                        </Text>
                      </View>
                      <View style={styles.methodRadio}>
                        {selectedMethod === method.id && (
                          <View style={styles.methodRadioSelected} />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                // Phone Number & OTP Input for Stripe
                <View style={styles.otpContainer}>
                  <View style={styles.securityBadge}>
                    <Ionicons
                      name="shield-checkmark"
                      size={24}
                      color="#4CAF50"
                    />
                    <Text style={styles.securityText}>
                      Secure Payment Verification
                    </Text>
                  </View>

                  {/* Phone Number Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <View style={styles.phoneInputContainer}>
                      <View style={styles.countryCode}>
                        <Text style={styles.countryCodeText}>+94</Text>
                      </View>
                      <TextInput
                        style={styles.phoneInput}
                        placeholder="71 234 5678"
                        placeholderTextColor="#999999"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        maxLength={10}
                        editable={!otpSent && !isProcessing}
                      />
                    </View>
                  </View>

                  {!otpSent ? (
                    <TouchableOpacity
                      style={[
                        styles.sendOtpButton,
                        isProcessing && styles.buttonDisabled,
                      ]}
                      onPress={handleSendOtp}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons
                            name="mail-outline"
                            size={20}
                            color="#FFFFFF"
                          />
                          <Text style={styles.sendOtpButtonText}>
                            Send Verification Code
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <>
                      {/* OTP Input */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                          Enter Verification Code
                        </Text>
                        <TextInput
                          style={styles.otpInput}
                          placeholder="000000"
                          placeholderTextColor="#999999"
                          value={otp}
                          onChangeText={setOtp}
                          keyboardType="numeric"
                          maxLength={6}
                          editable={!isProcessing}
                        />
                        <Text style={styles.otpHint}>
                          Enter the 6-digit code sent to {phoneNumber}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.verifyButton,
                          isProcessing && styles.buttonDisabled,
                        ]}
                        onPress={handleVerifyOtp}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color="#FFFFFF"
                            />
                            <Text style={styles.verifyButtonText}>
                              Verify & Continue
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.resendButton}
                        onPress={handleSendOtp}
                        disabled={isProcessing}
                      >
                        <Text style={styles.resendButtonText}>Resend Code</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                      setShowOtpInput(false);
                      setOtpSent(false);
                      setPhoneNumber("");
                      setOtp("");
                    }}
                    disabled={isProcessing}
                  >
                    <Ionicons name="arrow-back" size={20} color="#093F86" />
                    <Text style={styles.backButtonText}>
                      Change Payment Method
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  amountCard: {
    backgroundColor: "#E8F5E9",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontFamily: "Poppins-Bold",
    color: "#4CAF50",
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    textAlign: "center",
  },
  methodsContainer: {
    gap: 12,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  methodCardSelected: {
    borderColor: "#4CAF50",
    backgroundColor: "#F1F8F4",
  },
  methodIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666666",
  },
  methodRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D0D0D0",
    justifyContent: "center",
    alignItems: "center",
  },
  methodRadioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
  },
  otpContainer: {
    gap: 16,
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 8,
  },
  securityText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#4CAF50",
  },
  inputGroup: {
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#000000",
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 8,
    overflow: "hidden",
  },
  countryCode: {
    backgroundColor: "#093F86",
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  countryCodeText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#000000",
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  otpInput: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: "#000000",
    textAlign: "center",
    letterSpacing: 8,
  },
  otpHint: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    textAlign: "center",
    marginTop: 8,
  },
  sendOtpButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#093F86",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  sendOtpButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  verifyButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resendButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  resendButtonText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#093F86",
    textDecorationLine: "underline",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#093F86",
  },
});

export default PaymentSelectionModal;
