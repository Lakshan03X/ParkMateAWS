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
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import mcOfficerService from "../../../services/mcOfficerService";

const SysAdminEditMCOfficer = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [officerFormData, setOfficerFormData] = useState({
    fullName: (params.name as string) || "",
    phoneNumber: (params.mobileNumber as string) || "",
    email: (params.email as string) || "",
    municipalCouncilId: (params.zone as string) || "",
    password: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleUpdateOfficer = async () => {
    if (
      !officerFormData.fullName.trim() ||
      !officerFormData.phoneNumber.trim() ||
      !officerFormData.municipalCouncilId.trim() ||
      !officerFormData.email.trim()
    ) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    try {
      setIsSaving(true);

      const updates: any = {
        name: officerFormData.fullName,
        mobileNumber: officerFormData.phoneNumber,
        email: officerFormData.email,
        zone: officerFormData.municipalCouncilId,
        councilId: officerFormData.municipalCouncilId,
      };

      // Only update password if it's been changed
      if (officerFormData.password.trim()) {
        updates.password = officerFormData.password;
      }

      await mcOfficerService.updateOfficer(params.id as string, updates);

      setShowSuccessModal(true);

      // Navigate back after a short delay
      setTimeout(() => {
        setShowSuccessModal(false);
        router.back();
      }, 1500);
    } catch (error: any) {
      console.error("Error updating officer:", error);
      Alert.alert("Error", error.message || "Failed to update officer");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Safe Area Background */}
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#6FA882" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Edit Municipal{"\n"}Council Officer
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  placeholderTextColor="#999"
                  value={officerFormData.fullName}
                  onChangeText={(text) =>
                    setOfficerFormData({ ...officerFormData, fullName: text })
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter phone number"
                  placeholderTextColor="#999"
                  value={officerFormData.phoneNumber}
                  onChangeText={(text) =>
                    setOfficerFormData({
                      ...officerFormData,
                      phoneNumber: text,
                    })
                  }
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email"
                  placeholderTextColor="#999"
                  value={officerFormData.email}
                  onChangeText={(text) =>
                    setOfficerFormData({ ...officerFormData, email: text })
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Municipal Council Id</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter municipal council ID"
                  placeholderTextColor="#999"
                  value={officerFormData.municipalCouncilId}
                  onChangeText={(text) =>
                    setOfficerFormData({
                      ...officerFormData,
                      municipalCouncilId: text,
                    })
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Password{" "}
                  <Text style={styles.optionalText}>
                    (leave blank to keep current)
                  </Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password (optional)"
                  placeholderTextColor="#999"
                  value={officerFormData.password}
                  onChangeText={(text) =>
                    setOfficerFormData({
                      ...officerFormData,
                      password: text,
                    })
                  }
                  secureTextEntry
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleUpdateOfficer}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Update Details</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={80} color="#4A7C5B" />
            </View>
            <Text style={styles.successTitle}>Success!</Text>
            <Text style={styles.successMessage}>
              Successfully updated Municipal Council Officer
            </Text>
          </View>
        </View>
      </Modal>
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
    backgroundColor: "#6FA882",
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#6FA882",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    flex: 1,
    textAlign: "center",
    lineHeight: 24,
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    color: "#666",
    marginBottom: 6,
  },
  optionalText: {
    fontSize: 11,
    fontFamily: "Poppins-Regular",
    color: "#999",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#000",
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: "#F5F5F5",
  },
  saveButton: {
    backgroundColor: "#093F86",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  successModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: "80%",
    padding: 32,
    alignItems: "center",
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: "#000",
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
    textAlign: "center",
  },
});

export default SysAdminEditMCOfficer;
