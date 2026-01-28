import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import mcOfficerService from "../../services/mcOfficerService";

const MCOfficerCouncilSelection = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [selectedCouncil, setSelectedCouncil] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const municipalCouncils = [
    "Colombo",
    "Dehiwala-Mount Lavinia",
    "Sri Jayawardenepura Kotte",
    "Kaduwela",
    "Moratuwa",
    "Gampaha",
    "Negombo",
    "Kalutara",
  ];

  const handleSubmit = async () => {
    if (!selectedCouncil) {
      Alert.alert("Selection Required", "Please select a municipal council");
      return;
    }

    try {
      setIsLoading(true);

      // Update officer's selected council in database
      await mcOfficerService.updateOfficerCouncil(
        params.officerId as string,
        selectedCouncil
      );

      // Show success modal
      setShowSuccessModal(true);

      // Navigate to dashboard after a short delay
      setTimeout(() => {
        setShowSuccessModal(false);
        router.replace({
          pathname: "/screens/mcOfficer/mcOfficerDashboard",
          params: {
            officerId: params.officerId,
            officerName: params.officerName,
            selectedCouncil: selectedCouncil,
          },
        });
      }, 1500);
    } catch (error: any) {
      console.error("Error updating council:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to update council selection"
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
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <Image
              source={require("../../../assets/appImages/mcOfficerLogin.png")}
              style={{ width: 200, height: 200 }}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>Municipal Council</Text>
          <Text style={styles.title}>Officer Panel</Text>
          <Text style={styles.subtitle}>Select your Municipal Council</Text>

          {/* Council Selection */}
          <View style={styles.selectionContainer}>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedCouncil}
                onValueChange={(value) => setSelectedCouncil(value)}
                style={styles.picker}
                enabled={!isLoading}
              >
                <Picker.Item
                  label="Select Municipal Council"
                  value=""
                  style={styles.pickerPlaceholder}
                />
                {municipalCouncils.map((council) => (
                  <Picker.Item
                    key={council}
                    label={council}
                    value={council}
                    style={styles.pickerItem}
                  />
                ))}
              </Picker>
              <View style={styles.pickerIcon}>
                <Ionicons name="chevron-down" size={24} color="#666" />
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedCouncil || isLoading) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={!selectedCouncil || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Submit</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
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
              <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            </View>
            <Text style={styles.successTitle}>Success!</Text>
            <Text style={styles.successMessage}>
              Municipal Council selected successfully
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  illustrationContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    textAlign: "center",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 40,
  },
  selectionContainer: {
    marginBottom: 40,
  },
  pickerWrapper: {
    position: "relative",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#D0D0D0",
    borderRadius: 12,
    overflow: "hidden",
  },
  picker: {
    height: 56,
    width: "100%",
  },
  pickerPlaceholder: {
    color: "#999",
  },
  pickerItem: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
  },
  pickerIcon: {
    position: "absolute",
    right: 16,
    top: 16,
    pointerEvents: "none",
  },
  submitButton: {
    backgroundColor: "#093F86",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  submitButtonText: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  submitButtonDisabled: {
    backgroundColor: "#B0BEC5",
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

export default MCOfficerCouncilSelection;
