import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import stripePaymentService from "../app/services/stripePaymentService";

interface PaymentModalProps {
  visible: boolean;
  amount: number;
  description: string;
  onClose: () => void;
  onSuccess: (paymentId: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  amount,
  description,
  onClose,
  onSuccess,
}) => {
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const handleCardNumberChange = (text: string) => {
    const formatted = stripePaymentService.formatCardNumber(text);
    if (formatted.length <= 19) {
      setCardNumber(formatted);
      if (errors.cardNumber) {
        setErrors({ ...errors, cardNumber: null });
      }
    }
  };

  const handleExpiryChange = (text: string) => {
    let formatted = text.replace(/\D/g, "");
    if (formatted.length >= 2) {
      formatted = formatted.slice(0, 2) + "/" + formatted.slice(2, 4);
    }
    if (formatted.length <= 5) {
      setExpiryDate(formatted);
      if (errors.expiryDate) {
        setErrors({ ...errors, expiryDate: null });
      }
    }
  };

  const handleCvvChange = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length <= 4) {
      setCvv(cleaned);
      if (errors.cvv) {
        setErrors({ ...errors, cvv: null });
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};

    // Validate card number
    const cleanedCardNumber = cardNumber.replace(/\s/g, "");
    if (!cleanedCardNumber) {
      newErrors.cardNumber = "Card number is required";
    } else if (!stripePaymentService.validateCardNumber(cleanedCardNumber)) {
      newErrors.cardNumber = "Invalid card number";
    }

    // Validate expiry date
    if (!expiryDate) {
      newErrors.expiryDate = "Expiry date is required";
    } else {
      const [month, year] = expiryDate.split("/");
      const expMonth = parseInt(month);
      const expYear = parseInt(`20${year}`);
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      if (expMonth < 1 || expMonth > 12) {
        newErrors.expiryDate = "Invalid month";
      } else if (
        expYear < currentYear ||
        (expYear === currentYear && expMonth < currentMonth)
      ) {
        newErrors.expiryDate = "Card has expired";
      }
    }

    // Validate CVV
    if (!cvv) {
      newErrors.cvv = "CVV is required";
    } else if (cvv.length < 3) {
      newErrors.cvv = "Invalid CVV";
    }

    // Validate cardholder name
    if (!cardholderName.trim()) {
      newErrors.cardholderName = "Cardholder name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsProcessing(true);

      const [expMonth, expYear] = expiryDate.split("/");
      const cardDetails = {
        number: cardNumber.replace(/\s/g, ""),
        expMonth: parseInt(expMonth),
        expYear: parseInt(`20${expYear}`),
        cvc: cvv,
      };

      const result = await stripePaymentService.processPayment(
        cardDetails,
        amount,
        description
      );

      if (result.success) {
        onSuccess(result.paymentId);
        resetForm();
      } else {
        Alert.alert("Payment Failed", result.error || "Please try again");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      Alert.alert(
        "Payment Error",
        "Failed to process payment. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setCardNumber("");
    setExpiryDate("");
    setCvv("");
    setCardholderName("");
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const cardType = stripePaymentService.getCardType(cardNumber);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Payment Details</Text>
            <TouchableOpacity onPress={handleClose} disabled={isProcessing}>
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.formContainer}
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

            {/* Card Number Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Card Number</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="card-outline" size={20} color="#666666" />
                <TextInput
                  style={styles.input}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor="#999999"
                  value={cardNumber}
                  onChangeText={handleCardNumberChange}
                  keyboardType="numeric"
                  maxLength={19}
                  editable={!isProcessing}
                />
                {cardType !== "Unknown" && (
                  <Text style={styles.cardType}>{cardType}</Text>
                )}
              </View>
              {errors.cardNumber && (
                <Text style={styles.errorText}>{errors.cardNumber}</Text>
              )}
            </View>

            {/* Expiry Date and CVV */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Expiry Date</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="calendar-outline" size={20} color="#666666" />
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    placeholderTextColor="#999999"
                    value={expiryDate}
                    onChangeText={handleExpiryChange}
                    keyboardType="numeric"
                    maxLength={5}
                    editable={!isProcessing}
                  />
                </View>
                {errors.expiryDate && (
                  <Text style={styles.errorText}>{errors.expiryDate}</Text>
                )}
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>CVV</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#666666"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    placeholderTextColor="#999999"
                    value={cvv}
                    onChangeText={handleCvvChange}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    editable={!isProcessing}
                  />
                </View>
                {errors.cvv && (
                  <Text style={styles.errorText}>{errors.cvv}</Text>
                )}
              </View>
            </View>

            {/* Cardholder Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cardholder Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#666666" />
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#999999"
                  value={cardholderName}
                  onChangeText={(text) => {
                    setCardholderName(text);
                    if (errors.cardholderName) {
                      setErrors({ ...errors, cardholderName: null });
                    }
                  }}
                  autoCapitalize="words"
                  editable={!isProcessing}
                />
              </View>
              {errors.cardholderName && (
                <Text style={styles.errorText}>{errors.cardholderName}</Text>
              )}
            </View>

            {/* Security Notice */}
            <View style={styles.securityNotice}>
              <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
              <Text style={styles.securityText}>
                Your payment information is secure and encrypted
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isProcessing}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.payButton,
                isProcessing && styles.payButtonDisabled,
              ]}
              onPress={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="card" size={20} color="#FFFFFF" />
                  <Text style={styles.payButtonText}>Pay Now</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: "90%",
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
  formContainer: {
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#000000",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#000000",
    marginLeft: 10,
  },
  cardType: {
    fontSize: 12,
    fontFamily: "Poppins-SemiBold",
    color: "#093F86",
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#F44336",
    marginTop: 4,
    marginLeft: 4,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#4CAF50",
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#E0E0E0",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#666666",
  },
  payButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
});

export default PaymentModal;
