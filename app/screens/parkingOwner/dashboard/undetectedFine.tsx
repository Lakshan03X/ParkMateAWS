import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import parkingZoneService, { ParkingZone } from "../../../services/parkingZoneService";

const UndetectedFine = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { vehicleNumber } = params;

  const [parkingZone, setParkingZone] = useState("");
  const [duration, setDuration] = useState("");
  const [showZonePicker, setShowZonePicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [zones, setZones] = useState<string[]>([]);
  const [isLoadingZones, setIsLoadingZones] = useState(true);

  // Fetch parking zones from Firebase on component mount
  useEffect(() => {
    fetchParkingZones();
  }, []);

  const fetchParkingZones = async () => {
    try {
      setIsLoadingZones(true);
      const fetchedZones = await parkingZoneService.getParkingZonesByStatus("active");
      
      // Format zones as display strings (e.g., "Zone A - Location Name")
      const zoneNames = fetchedZones.map((zone: ParkingZone) => 
        `${zone.zoneCode} - ${zone.location}`
      );
      
      setZones(zoneNames);
    } catch (error) {
      console.error("Error fetching parking zones:", error);
      Alert.alert("Error", "Failed to load parking zones");
      // Fallback to empty array if fetch fails
      setZones([]);
    } finally {
      setIsLoadingZones(false);
    }
  };

  const durations = [
    "30 minutes",
    "1 hour",
    "1 hour 30 minutes",
    "2 hours",
    "2 hours 30 minutes",
    "3 hours",
    "3 hours 30 minutes",
  ];

  const handleConfirm = async () => {
    if (!parkingZone) {
      Alert.alert("Missing Information", "Please select a parking zone");
      return;
    }
    if (!duration) {
      Alert.alert("Missing Information", "Please select duration");
      return;
    }

    try {
      setIsProcessing(true);

      // Navigate to active ticket screen with ticket details
      router.push({
        pathname: "/screens/parkingOwner/dashboard/activeTicket",
        params: {
          vehicleNumber,
          parkingZone,
          duration,
        },
      });
    } catch (error) {
      console.error("Error creating ticket:", error);
      Alert.alert("Error", "Failed to create parking ticket");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#E8F5E9" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apply Ticket</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Vehicle Number */}
        <View style={styles.vehicleCard}>
          <Text style={styles.vehicleNumber}>{vehicleNumber}</Text>
        </View>

        {/* Parking Zone Selection */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Parking Zone</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowZonePicker(true)}
          >
            <Text
              style={[styles.pickerText, !parkingZone && styles.placeholder]}
            >
              {parkingZone || "Select parking zone"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666666" />
          </TouchableOpacity>
        </View>

        {/* Duration Selection */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Duration</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowDurationPicker(true)}
          >
            <Text style={[styles.pickerText, !duration && styles.placeholder]}>
              {duration || "Select duration"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666666" />
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#093F86" />
          <Text style={styles.infoText}>
            Select your parking zone and duration to generate a parking ticket
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={isProcessing}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.confirmButton,
            isProcessing && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Zone Picker Modal */}
      <Modal
        visible={showZonePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowZonePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Parking Zone</Text>
              <TouchableOpacity onPress={() => setShowZonePicker(false)}>
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.optionsList}>
              {zones.map((zone, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.optionItem}
                  onPress={() => {
                    setParkingZone(zone);
                    setShowZonePicker(false);
                  }}
                >
                  <Text style={styles.optionText}>{zone}</Text>
                  {parkingZone === zone && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Duration Picker Modal */}
      <Modal
        visible={showDurationPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDurationPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Duration</Text>
              <TouchableOpacity onPress={() => setShowDurationPicker(false)}>
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.optionsList}>
              {durations.map((dur, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.optionItem}
                  onPress={() => {
                    setDuration(dur);
                    setShowDurationPicker(false);
                  }}
                >
                  <Text style={styles.optionText}>{dur}</Text>
                  {duration === dur && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
  },
  backIcon: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  vehicleCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
    marginTop: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  vehicleNumber: {
    fontSize: 32,
    fontFamily: "Poppins-Bold",
    color: "#000000",
    letterSpacing: 2,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#000000",
    marginBottom: 8,
  },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pickerText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#000000",
  },
  placeholder: {
    color: "#999999",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#E3F2FD",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#093F86",
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#ff100d",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#093F86",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
  },
  optionsList: {
    paddingHorizontal: 20,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  optionText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#000000",
  },
});

export default UndetectedFine;
