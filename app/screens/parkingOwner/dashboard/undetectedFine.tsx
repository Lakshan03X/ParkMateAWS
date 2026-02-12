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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import parkingZoneService, {
  ParkingZone,
} from "../../../services/parkingZoneService";

const UndetectedFine = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { vehicleNumber, parkingZone: passedParkingZone } = params;

  const [parkingZone, setParkingZone] = useState("");
  const [selectedZoneData, setSelectedZoneData] = useState<ParkingZone | null>(
    null,
  );
  const [selectedSection, setSelectedSection] = useState("");
  const [duration, setDuration] = useState("");
  const [showZonePicker, setShowZonePicker] = useState(false);
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [allZones, setAllZones] = useState<ParkingZone[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [isLoadingZones, setIsLoadingZones] = useState(true);
  const [parkingFee, setParkingFee] = useState<number>(0);

  // Fetch parking zones from AWS DynamoDB on component mount
  useEffect(() => {
    fetchParkingZones();
  }, []);

  // Auto-select parking zone if passed from viewParking screen
  useEffect(() => {
    if (
      passedParkingZone &&
      typeof passedParkingZone === "string" &&
      allZones.length > 0
    ) {
      // Use handleZoneSelect to properly load zone data and sections
      handleZoneSelect(passedParkingZone);
    }
  }, [passedParkingZone, allZones]);

  const fetchParkingZones = async () => {
    try {
      setIsLoadingZones(true);
      const fetchedZones =
        await parkingZoneService.getParkingZonesByStatus("active");

      // Store all zone data
      setAllZones(fetchedZones);

      // Format zones as display strings (e.g., "Zone A - Location Name")
      const zoneNames = fetchedZones.map(
        (zone: ParkingZone) => `${zone.zoneCode} - ${zone.location}`,
      );

      setZones(zoneNames);
    } catch (error) {
      console.error("Error fetching parking zones:", error);
      Alert.alert("Error", "Failed to load parking zones");
      // Fallback to empty array if fetch fails
      setZones([]);
      setAllZones([]);
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

  // Calculate parking fee based on duration and zone rate
  const calculateParkingFee = (duration: string, zoneRate: string) => {
    // Parse duration to minutes
    let totalMinutes = 0;
    const hourMatch = duration.match(/(\d+)\s*hour/i);
    if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
    const minuteMatch = duration.match(/(\d+)\s*minute/i);
    if (minuteMatch) totalMinutes += parseInt(minuteMatch[1]);

    // Parse rate (e.g., "Rs. 150 per hour" or "150")
    const rateMatch = zoneRate.match(/(\d+)/);
    const ratePerHour = rateMatch ? parseInt(rateMatch[1]) : 100;

    // Calculate fee proportionally
    const hours = totalMinutes / 60;
    const fee = hours * ratePerHour;
    const roundedFee = Math.round(fee);

    console.log(
      `💰 UI Fee Calculation: ${duration} (${totalMinutes} mins) ÷ 60 = ${hours.toFixed(2)} hrs × Rs.${ratePerHour}/hr = Rs.${fee.toFixed(2)} → Rs.${roundedFee}`,
    );

    return roundedFee;
  };

  // Handle zone selection
  const handleZoneSelect = (zone: string) => {
    setParkingZone(zone);

    // Find the full zone data
    let locationToSearch = zone;
    if (zone.includes(" - ")) {
      locationToSearch = zone.split(" - ")[1].trim();
    }

    const zoneData = allZones.find((z) => z.location === locationToSearch);
    setSelectedZoneData(zoneData || null);

    if (zoneData) {
      console.log(`🅿️ Zone Selected: ${zone}`);
      console.log(`📊 Full Zone Data:`, JSON.stringify(zoneData, null, 2));
    } else {
      console.log(`🅿️ Zone Selected: ${zone} (not found)`);
    }

    // Parse and set sections
    if (zoneData?.parkingSections) {
      console.log(`🔍 Raw parkingSections field:`, zoneData.parkingSections);
      const sectionArray = zoneData.parkingSections
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);
      console.log(`📍 Parsed sections array:`, sectionArray);
      console.log(`📊 Sections array length:`, sectionArray.length);
      setSections(sectionArray);
      setSelectedSection(""); // Reset section when zone changes

      if (sectionArray.length > 0) {
        Alert.alert(
          "Sections Loaded",
          `Found ${sectionArray.length} sections:\n${sectionArray.join("\n")}`,
        );
      }
    } else {
      console.log(`⚠️ No parkingSections field found in zone data`);
      console.log(
        `💡 Attempting to auto-generate sections from totalParkingSpots: ${zoneData?.totalParkingSpots}`,
      );

      // Auto-generate sections if missing
      if (zoneData?.totalParkingSpots) {
        const spots = parseInt(zoneData.totalParkingSpots);
        if (!isNaN(spots) && spots > 0) {
          const numSections = Math.ceil(spots / 50);
          const generatedSections: string[] = [];
          for (let i = 0; i < numSections; i++) {
            const sectionLetter = String.fromCharCode(65 + i);
            generatedSections.push(`Section ${sectionLetter}`);
          }
          console.log(
            `✅ Auto-generated ${generatedSections.length} sections:`,
            generatedSections,
          );
          setSections(generatedSections);
          setSelectedSection("");
          Alert.alert(
            "Sections Generated",
            `Auto-generated ${generatedSections.length} sections based on ${spots} parking spots.\n\n${generatedSections.join(", ")}\n\nNote: Ask admin to update this zone to save sections permanently.`,
          );
        } else {
          setSections([]);
          setSelectedSection("");
        }
      } else {
        setSections([]);
        setSelectedSection("");
      }
    }

    setShowZonePicker(false);

    // Recalculate fee if duration is selected
    if (duration && zoneData) {
      const fee = calculateParkingFee(duration, zoneData.parkingRate);
      setParkingFee(fee);
    }
  };

  // Handle duration selection
  const handleDurationSelect = (dur: string) => {
    setDuration(dur);
    setShowDurationPicker(false);

    console.log(`⏱️ Duration Selected: ${dur}`);

    // Recalculate fee if zone is selected
    if (selectedZoneData) {
      const fee = calculateParkingFee(dur, selectedZoneData.parkingRate);
      setParkingFee(fee);
      console.log(`💵 Updated Parking Fee: Rs.${fee}`);
    }
  };

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

      // Re-check parking zone availability
      const fetchedZones =
        await parkingZoneService.getParkingZonesByStatus("active");
      let locationToSearch = parkingZone;
      if (parkingZone.includes(" - ")) {
        locationToSearch = parkingZone.split(" - ")[1].trim();
      }

      const selectedZone = fetchedZones.find(
        (zone: ParkingZone) => zone.location === locationToSearch,
      );

      if (selectedZone) {
        const availableSpots =
          selectedZone.availableSpots ??
          parseInt(selectedZone.totalParkingSpots || "0");
        if (availableSpots <= 0) {
          Alert.alert(
            "Parking Full",
            "This parking zone is currently full. Please select a different zone or try again later.",
            [{ text: "OK" }],
          );
          setIsProcessing(false);
          return;
        }

        // Recalculate and confirm parking fee
        const finalFee = calculateParkingFee(
          duration,
          selectedZone.parkingRate,
        );
        setParkingFee(finalFee);

        console.log(
          `✅ Final Confirmation:\n` +
            `   Vehicle: ${vehicleNumber}\n` +
            `   Zone: ${parkingZone}\n` +
            `   Section: ${selectedSection || "(Not selected)"}\n` +
            `   Duration: ${duration}\n` +
            `   Rate: ${selectedZone.parkingRate}\n` +
            `   Final Fee: Rs.${finalFee}`,
        );

        // Show confirmation with fee
        Alert.alert(
          "Confirm Parking",
          `Parking Zone: ${parkingZone}\n${selectedSection ? `Section: ${selectedSection}\n` : ""}Duration: ${duration}\nParking Fee: Rs. ${finalFee}\n\nProceed to create ticket?`,
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => setIsProcessing(false),
            },
            {
              text: "Confirm",
              onPress: () => proceedToTicket(),
            },
          ],
        );
      } else {
        throw new Error("Selected zone not found");
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      Alert.alert("Error", "Failed to create parking ticket");
      setIsProcessing(false);
    }
  };

  const proceedToTicket = () => {
    // Navigate to active ticket screen with ticket details
    router.push({
      pathname: "/screens/parkingOwner/dashboard/activeTicket",
      params: {
        vehicleNumber,
        parkingZone,
        parkingSection: selectedSection || "",
        duration,
      },
    });
    setIsProcessing(false);
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
          {selectedZoneData && (
            <View style={styles.zoneInfoCard}>
              <View style={styles.zoneInfoRow}>
                <Ionicons name="cash-outline" size={16} color="#093F86" />
                <Text style={styles.zoneInfoText}>
                  Rate: {selectedZoneData.parkingRate}
                </Text>
              </View>
              <View style={styles.zoneInfoRow}>
                <Ionicons name="car-outline" size={16} color="#4CAF50" />
                <Text style={styles.zoneInfoText}>
                  Available:{" "}
                  {selectedZoneData.availableSpots ??
                    parseInt(selectedZoneData.totalParkingSpots || "0")}
                  /{selectedZoneData.totalParkingSpots} spots
                </Text>
              </View>
              {sections.length > 0 && (
                <View style={styles.zoneInfoRow}>
                  <Ionicons name="grid-outline" size={16} color="#6FA882" />
                  <Text style={styles.zoneInfoText}>
                    Sections: {sections.join(", ")}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Parking Section Selection */}
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Parking Section</Text>
            <Text style={styles.optionalBadge}>Optional</Text>
          </View>
          <TouchableOpacity
            style={[styles.picker, selectedSection && styles.pickerSelected]}
            onPress={() => {
              console.log(
                `🎯 Section picker clicked. Sections count: ${sections.length}`,
              );
              console.log(`📋 Current sections:`, sections);
              setShowSectionPicker(true);
            }}
          >
            <View style={styles.pickerContent}>
              <Ionicons
                name={selectedSection ? "checkmark-circle" : "grid-outline"}
                size={20}
                color={selectedSection ? "#4CAF50" : "#666666"}
              />
              <Text
                style={[
                  styles.pickerText,
                  !selectedSection && styles.placeholder,
                  selectedSection && styles.pickerTextSelected,
                ]}
              >
                {selectedSection || "Select parking section"}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#666666" />
          </TouchableOpacity>
          <Text style={styles.sectionHelper}>
            💡{" "}
            {sections.length > 0
              ? `${sections.length} sections available - Select`
              : "Enter"}{" "}
            a section to help you remember where you parked
          </Text>
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

        {/* Parking Fee Display */}
        {parkingFee > 0 && (
          <View style={styles.feeCard}>
            <Text style={styles.feeLabel}>Parking Fee</Text>
            <Text style={styles.feeValue}>
              Rs. {parkingFee.toLocaleString()}
            </Text>
          </View>
        )}

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
                  onPress={() => handleZoneSelect(zone)}
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
                  onPress={() => handleDurationSelect(dur)}
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

      {/* Section Picker Modal */}
      <Modal
        visible={showSectionPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSectionPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {sections.length > 0
                  ? "Select Parking Section"
                  : "Enter Parking Section"}
              </Text>
              <TouchableOpacity onPress={() => setShowSectionPicker(false)}>
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            <View style={styles.sectionHintContainer}>
              <Ionicons name="information-circle" size={18} color="#093F86" />
              <Text style={styles.sectionHintText}>
                {sections.length > 0
                  ? `${sections.length} sections available - Choose a section to help locate your vehicle later`
                  : "No predefined sections - Enter a custom section to help remember where you parked"}
              </Text>
            </View>
            {sections.length > 0 ? (
              <ScrollView style={styles.optionsList}>
                {sections.map((section, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionItem,
                      selectedSection === section && styles.optionItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedSection(section);
                      setShowSectionPicker(false);
                    }}
                  >
                    <View style={styles.sectionOptionContent}>
                      <Ionicons
                        name="car"
                        size={20}
                        color={selectedSection === section ? "#4CAF50" : "#666"}
                      />
                      <Text
                        style={[
                          styles.optionText,
                          selectedSection === section &&
                            styles.optionTextSelected,
                        ]}
                      >
                        {section}
                      </Text>
                    </View>
                    {selectedSection === section && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#4CAF50"
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.manualInputContainer}>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="Enter section (e.g., A1, B2, Ground Floor)"
                  placeholderTextColor="#999999"
                  value={selectedSection}
                  onChangeText={setSelectedSection}
                  autoFocus={true}
                />
                <TouchableOpacity
                  style={styles.confirmSectionButton}
                  onPress={() => setShowSectionPicker(false)}
                >
                  <Text style={styles.confirmSectionButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
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
  pickerSelected: {
    borderColor: "#4CAF50",
    borderWidth: 2,
    backgroundColor: "#F1F8F4",
  },
  pickerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  pickerText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#000000",
  },
  pickerTextSelected: {
    color: "#2E7D32",
    fontFamily: "Poppins-SemiBold",
  },
  placeholder: {
    color: "#999999",
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#000000",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  optionalBadge: {
    fontSize: 11,
    fontFamily: "Poppins-Medium",
    color: "#666666",
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionHelper: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    marginTop: 6,
    fontStyle: "italic",
  },
  zoneInfoCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    gap: 8,
  },
  zoneInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  zoneInfoText: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#333333",
  },
  feeCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  feeLabel: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#666666",
    marginBottom: 8,
  },
  feeValue: {
    fontSize: 32,
    fontFamily: "Poppins-Bold",
    color: "#4CAF50",
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
  optionItemSelected: {
    backgroundColor: "#E8F5E9",
    borderLeftWidth: 3,
    borderLeftColor: "#4CAF50",
  },
  optionTextSelected: {
    color: "#2E7D32",
    manualInputContainer: {
      padding: 20,
      gap: 16,
    },
    modalTextInput: {
      backgroundColor: "#F5F5F5",
      borderWidth: 1,
      borderColor: "#D0D0D0",
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      fontFamily: "Poppins-Regular",
      color: "#000000",
    },
    confirmSectionButton: {
      backgroundColor: "#093F86",
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: "center",
    },
    confirmSectionButtonText: {
      fontSize: 16,
      fontFamily: "Poppins-SemiBold",
      color: "#FFFFFF",
    },
    fontFamily: "Poppins-SemiBold",
  },
  sectionHintContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#E3F2FD",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  sectionHintText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#093F86",
  },
  sectionOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});

export default UndetectedFine;
