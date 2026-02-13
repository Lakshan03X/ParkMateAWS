import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT, UrlTile } from "react-native-maps";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import parkingZoneService from "../../services/parkingZoneService";

const AddParkingZone = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [isSaving, setIsSaving] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [tempCoordinates, setTempCoordinates] = useState<{
    latitude: number;
    longitude: number;
  }>({
    latitude: 6.9271, // Default to Colombo, Sri Lanka
    longitude: 79.8612,
  });

  // Calculate parking sections based on total parking spots
  const calculateParkingSections = (totalSpots: string): string => {
    const spots = parseInt(totalSpots);
    if (isNaN(spots) || spots <= 0) return "";

    const numSections = Math.ceil(spots / 50);
    const sections: string[] = [];

    for (let i = 0; i < numSections; i++) {
      const sectionLetter = String.fromCharCode(65 + i); // A, B, C, D...
      sections.push(`Section ${sectionLetter}`);
    }

    return sections.join(", ");
  };

  // Form states
  const [formData, setFormData] = useState({
    municipalCouncil: (params.selectedCouncil as string) || "",
    zoneCode: "",
    location: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    parkingRate: "",
    activeHours: "",
    totalParkingSpots: "",
  });

  // Time picker states
  const [startHour, setStartHour] = useState("08");
  const [startMinute, setStartMinute] = useState("00");
  const [startPeriod, setStartPeriod] = useState("AM");
  const [endHour, setEndHour] = useState("05");
  const [endMinute, setEndMinute] = useState("00");
  const [endPeriod, setEndPeriod] = useState("PM");

  const hours = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0"),
  );
  const periods = ["AM", "PM"];

  const formatActiveHours = () => {
    return `${startHour}:${startMinute} ${startPeriod} - ${endHour}:${endMinute} ${endPeriod}`;
  };

  const validateForm = () => {
    if (!formData.municipalCouncil.trim()) {
      Alert.alert("Validation Error", "Please select a municipal council");
      return false;
    }
    if (!formData.zoneCode.trim()) {
      Alert.alert("Validation Error", "Please enter a zone code");
      return false;
    }
    if (!formData.location.trim()) {
      Alert.alert("Validation Error", "Please enter a location");
      return false;
    }
    if (!formData.parkingRate.trim()) {
      Alert.alert("Validation Error", "Please enter a parking rate");
      return false;
    }
    if (!formData.totalParkingSpots.trim()) {
      Alert.alert("Validation Error", "Please enter total parking spots");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);

      const activeHours = formatActiveHours();
      const parkingSections = calculateParkingSections(
        formData.totalParkingSpots,
      );

      const zoneData = {
        ...formData,
        activeHours,
        parkingSections,
        availableSpots: parseInt(formData.totalParkingSpots),
        status: "inactive" as const, // Inactive until verified
        verificationStatus: "pending" as const, // Pending MC Admin verification
        createdBy: (params.officerId as string) || "", // MC Officer who created it
      };

      await parkingZoneService.addParkingZone(zoneData);

      console.log("✅ Parking zone submitted for verification:", zoneData);

      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Error adding parking zone:", error);
      Alert.alert("Error", error.message || "Failed to add parking zone");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.back();
  };

  const handleMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setTempCoordinates({ latitude, longitude });
  };

  const handleOpenMap = () => {
    // Initialize temp coordinates if form has coordinates, otherwise use defaults
    if (formData.latitude && formData.longitude) {
      setTempCoordinates({
        latitude: formData.latitude,
        longitude: formData.longitude,
      });
    } else {
      setTempCoordinates({
        latitude: 6.9271,
        longitude: 79.8612,
      });
    }
    setShowMapModal(true);
  };

  const handleConfirmLocation = () => {
    setFormData({
      ...formData,
      latitude: tempCoordinates.latitude,
      longitude: tempCoordinates.longitude,
    });
    setShowMapModal(false);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Parking Zone</Text>
          <View style={styles.headerRight} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formContainer}>
              {/* Municipal Council */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Municipal Council *</Text>
                <Text style={styles.readOnlyText}>
                  {formData.municipalCouncil}
                </Text>
              </View>

              {/* Zone Code */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Zone Code *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.zoneCode}
                  onChangeText={(text) =>
                    setFormData({ ...formData, zoneCode: text })
                  }
                  placeholder="e.g., Z001"
                  placeholderTextColor="#999999"
                />
              </View>

              {/* Location */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Location *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.location}
                  onChangeText={(text) =>
                    setFormData({ ...formData, location: text })
                  }
                  placeholder="e.g., Main Street Area"
                  placeholderTextColor="#999999"
                />
              </View>

              {/* Coordinates */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Coordinates (Optional)</Text>
                <TouchableOpacity
                  style={styles.mapButton}
                  onPress={() => setShowMapModal(true)}
                >
                  <Ionicons name="location" size={20} color="#4CAF50" />
                  <Text style={styles.mapButtonText}>
                    {formData.latitude && formData.longitude
                      ? `${formData.latitude.toFixed(6)}, ${formData.longitude.toFixed(6)}`
                      : "Select Location on Map"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Parking Rate */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Parking Rate (Rs/hour) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.parkingRate}
                  onChangeText={(text) =>
                    setFormData({ ...formData, parkingRate: text })
                  }
                  placeholder="e.g., 100"
                  placeholderTextColor="#999999"
                  keyboardType="numeric"
                />
              </View>

              {/* Active Hours */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Active Hours *</Text>
                <View style={styles.timeContainer}>
                  {/* Start Time */}
                  <View style={styles.timeRow}>
                    <Text style={styles.timeLabel}>From:</Text>
                    <Picker
                      selectedValue={startHour}
                      onValueChange={setStartHour}
                      style={styles.timePicker}
                    >
                      {hours.map((h) => (
                        <Picker.Item key={h} label={h} value={h} />
                      ))}
                    </Picker>
                    <Text style={styles.timeSeparator}>:</Text>
                    <Picker
                      selectedValue={startMinute}
                      onValueChange={setStartMinute}
                      style={styles.timePicker}
                    >
                      {minutes.map((m) => (
                        <Picker.Item key={m} label={m} value={m} />
                      ))}
                    </Picker>
                    <Picker
                      selectedValue={startPeriod}
                      onValueChange={setStartPeriod}
                      style={styles.periodPicker}
                    >
                      {periods.map((p) => (
                        <Picker.Item key={p} label={p} value={p} />
                      ))}
                    </Picker>
                  </View>

                  {/* End Time */}
                  <View style={styles.timeRow}>
                    <Text style={styles.timeLabel}>To:</Text>
                    <Picker
                      selectedValue={endHour}
                      onValueChange={setEndHour}
                      style={styles.timePicker}
                    >
                      {hours.map((h) => (
                        <Picker.Item key={h} label={h} value={h} />
                      ))}
                    </Picker>
                    <Text style={styles.timeSeparator}>:</Text>
                    <Picker
                      selectedValue={endMinute}
                      onValueChange={setEndMinute}
                      style={styles.timePicker}
                    >
                      {minutes.map((m) => (
                        <Picker.Item key={m} label={m} value={m} />
                      ))}
                    </Picker>
                    <Picker
                      selectedValue={endPeriod}
                      onValueChange={setEndPeriod}
                      style={styles.periodPicker}
                    >
                      {periods.map((p) => (
                        <Picker.Item key={p} label={p} value={p} />
                      ))}
                    </Picker>
                  </View>
                </View>
                <Text style={styles.previewText}>{formatActiveHours()}</Text>
              </View>

              {/* Total Parking Spots */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Total Parking Spots *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.totalParkingSpots}
                  onChangeText={(text) =>
                    setFormData({ ...formData, totalParkingSpots: text })
                  }
                  placeholder="e.g., 100"
                  placeholderTextColor="#999999"
                  keyboardType="numeric"
                />
                {formData.totalParkingSpots && (
                  <Text style={styles.helperText}>
                    Sections:{" "}
                    {calculateParkingSections(formData.totalParkingSpots)}
                  </Text>
                )}
              </View>

              {/* Info Box */}
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color="#2196F3" />
                <Text style={styles.infoText}>
                  This parking zone will be submitted for MC Admin verification
                  before it becomes active.
                </Text>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isSaving && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    Submit for Verification
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Map Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        onRequestClose={() => setShowMapModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapHeaderTitle}>Select Location</Text>
            <TouchableOpacity onPress={() => setShowMapModal(false)}>
              <Ionicons name="close" size={28} color="#000000" />
            </TouchableOpacity>
          </View>

          <MapView
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={{
              latitude: tempCoordinates.latitude,
              longitude: tempCoordinates.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            onPress={handleMapPress}
          >
            <UrlTile
              urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
              maximumZ={19}
              minimumZ={1}
              tileSize={256}
              flipY={false}
              shouldReplaceMapContent={true}
            />
            <Marker
              coordinate={tempCoordinates}
              draggable
              onDragEnd={handleMapPress}
            >
              <View style={styles.customMarker}>
                <Ionicons name="location" size={40} color="#4CAF50" />
              </View>
            </Marker>
          </MapView>

          <View style={styles.mapFooter}>
            <View style={styles.mapInfoCard}>
              <Text style={styles.mapInfoTitle}>Selected Coordinates</Text>
              <Text style={styles.mapInfoText}>
                Latitude: {tempCoordinates.latitude.toFixed(6)}
              </Text>
              <Text style={styles.mapInfoText}>
                Longitude: {tempCoordinates.longitude.toFixed(6)}
              </Text>
              <Text style={styles.mapInfoHint}>
                Tap anywhere on the map or drag the marker
              </Text>
            </View>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmLocation}
            >
              <Text style={styles.confirmButtonText}>Confirm Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleSuccessClose}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            <Text style={styles.successTitle}>Zone Submitted!</Text>
            <Text style={styles.successMessage}>
              Your parking zone has been submitted for MC Admin verification.
              You will be notified once it's reviewed.
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={handleSuccessClose}
            >
              <Text style={styles.successButtonText}>OK</Text>
            </TouchableOpacity>
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
    backgroundColor: "#4CAF50",
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#4CAF50",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#000000",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  readOnlyText: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#4CAF50",
    gap: 8,
  },
  mapButtonText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#4CAF50",
    flex: 1,
  },
  timeContainer: {
    gap: 12,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeLabel: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    width: 50,
  },
  timePicker: {
    flex: 1,
    height: 40,
  },
  periodPicker: {
    width: 80,
    height: 40,
  },
  timeSeparator: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    color: "#000000",
  },
  previewText: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    marginTop: 4,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#1976D2",
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  modalContainer: {
    flex: 1,
  },
  mapHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  mapHeaderTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
  },
  map: {
    flex: 1,
  },
  customMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  mapFooter: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  mapInfoCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  mapInfoTitle: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    marginBottom: 8,
  },
  mapInfoText: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    marginBottom: 4,
  },
  mapInfoHint: {
    fontSize: 11,
    fontFamily: "Poppins-Regular",
    color: "#999999",
    marginTop: 4,
    fontStyle: "italic",
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
  },
  successTitle: {
    fontSize: 22,
    fontFamily: "Poppins-Bold",
    color: "#000000",
    marginTop: 16,
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  successButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 48,
  },
  successButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
});

export default AddParkingZone;
