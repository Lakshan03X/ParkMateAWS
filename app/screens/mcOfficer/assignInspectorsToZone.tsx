import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import parkingZoneService, {
  ParkingZone,
} from "../../services/parkingZoneService";
import inspectorService, { Inspector } from "../../services/inspectorService";

const AssignInspectorsToZone = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [zones, setZones] = useState<ParkingZone[]>([]);
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [selectedZone, setSelectedZone] = useState<ParkingZone | null>(null);
  const [selectedInspectors, setSelectedInspectors] = useState<string[]>([]);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showInspectorModal, setShowInspectorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [zonesData, inspectorsData] = await Promise.all([
        parkingZoneService.getVerifiedZones(), // Only show verified zones
        inspectorService.getAllInspectors(),
      ]);

      // Filter zones by municipal council if available
      const councilZones = params.selectedCouncil
        ? zonesData.filter((z) => z.municipalCouncil === params.selectedCouncil)
        : zonesData;

      setZones(councilZones);
      setInspectors(inspectorsData);
    } catch (error: any) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load zones and inspectors");
    } finally {
      setIsLoading(false);
    }
  };

  const handleZoneSelect = (zone: ParkingZone) => {
    setSelectedZone(zone);
    // Load previously assigned inspectors for this zone
    if (zone.assignedInspectors) {
      setSelectedInspectors(zone.assignedInspectors);
    } else {
      setSelectedInspectors([]);
    }
    setShowZoneModal(false);
  };

  const toggleInspectorSelection = (inspectorId: string) => {
    setSelectedInspectors((prev) => {
      if (prev.includes(inspectorId)) {
        return prev.filter((id) => id !== inspectorId);
      } else {
        return [...prev, inspectorId];
      }
    });
  };

  const handleSave = async () => {
    if (!selectedZone) {
      Alert.alert("Error", "Please select a parking zone");
      return;
    }

    if (selectedInspectors.length === 0) {
      Alert.alert("Error", "Please select at least one inspector");
      return;
    }

    try {
      setIsSaving(true);

      // Assign inspectors to the zone
      await parkingZoneService.assignInspectorsToZone(
        selectedZone.id,
        selectedInspectors,
      );

      // Update each inspector with the zone assignment
      for (const inspectorId of selectedInspectors) {
        await inspectorService.updateInspector(inspectorId, {
          assignedZone: selectedZone.zoneCode,
          isAssigned: true,
        });
      }

      console.log(
        `✅ Assigned ${selectedInspectors.length} inspectors to zone ${selectedZone.zoneCode}`,
      );

      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Error assigning inspectors:", error);
      Alert.alert("Error", error.message || "Failed to assign inspectors");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.back();
  };

  const getInspectorName = (inspectorId: string) => {
    const inspector = inspectors.find((i) => i.id === inspectorId);
    return inspector?.name || "Unknown";
  };

  const renderZoneItem = (zone: ParkingZone) => (
    <TouchableOpacity
      key={zone.id}
      style={styles.listItem}
      onPress={() => handleZoneSelect(zone)}
      activeOpacity={0.7}
    >
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle}>{zone.zoneCode}</Text>
        <Text style={styles.listItemSubtitle}>{zone.location}</Text>
        {zone.assignedInspectors && zone.assignedInspectors.length > 0 && (
          <Text style={styles.listItemInfo}>
            {zone.assignedInspectors.length} inspector(s) assigned
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={24} color="#666666" />
    </TouchableOpacity>
  );

  const renderInspectorItem = (inspector: Inspector) => {
    const isSelected = selectedInspectors.includes(inspector.id);

    return (
      <TouchableOpacity
        key={inspector.id}
        style={[
          styles.inspectorItem,
          isSelected && styles.inspectorItemSelected,
        ]}
        onPress={() => toggleInspectorSelection(inspector.id)}
        activeOpacity={0.7}
      >
        <View style={styles.checkboxContainer}>
          <View
            style={[styles.checkbox, isSelected && styles.checkboxSelected]}
          >
            {isSelected && (
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            )}
          </View>
        </View>
        <View style={styles.inspectorInfo}>
          <Text style={styles.inspectorName}>{inspector.name}</Text>
          <Text style={styles.inspectorDetails}>
            ID: {inspector.inspectorId || inspector.id}
          </Text>
          {inspector.assignedZone && (
            <Text style={styles.inspectorZone}>
              Currently assigned to: {inspector.assignedZone}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>Assign Inspectors</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Zone Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Parking Zone</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowZoneModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.selectButtonText}>
                {selectedZone
                  ? `${selectedZone.zoneCode} - ${selectedZone.location}`
                  : "Choose Zone"}
              </Text>
              <Ionicons name="chevron-down" size={24} color="#666666" />
            </TouchableOpacity>
          </View>

          {/* Inspector Selection */}
          {selectedZone && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Select Inspectors</Text>
                <Text style={styles.selectedCount}>
                  {selectedInspectors.length} selected
                </Text>
              </View>

              <TouchableOpacity
                style={styles.selectAllButton}
                onPress={() => setShowInspectorModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="people" size={20} color="#4CAF50" />
                <Text style={styles.selectAllButtonText}>
                  Choose Inspectors ({inspectors.length} available)
                </Text>
              </TouchableOpacity>

              {/* Selected Inspectors List */}
              {selectedInspectors.length > 0 && (
                <View style={styles.selectedList}>
                  {selectedInspectors.map((inspectorId) => (
                    <View key={inspectorId} style={styles.selectedItem}>
                      <Text style={styles.selectedItemText}>
                        {getInspectorName(inspectorId)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => toggleInspectorSelection(inspectorId)}
                      >
                        <Ionicons
                          name="close-circle"
                          size={24}
                          color="#FF4444"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Save Button */}
          {selectedZone && selectedInspectors.length > 0 && (
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Assign Inspectors</Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Zone Selection Modal */}
      <Modal
        visible={showZoneModal}
        animationType="slide"
        onRequestClose={() => setShowZoneModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Parking Zone</Text>
            <TouchableOpacity onPress={() => setShowZoneModal(false)}>
              <Ionicons name="close" size={28} color="#000000" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={zones}
            renderItem={({ item }) => renderZoneItem(item)}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons
                  name="folder-open-outline"
                  size={64}
                  color="#CCCCCC"
                />
                <Text style={styles.emptyStateText}>
                  No verified zones available
                </Text>
              </View>
            }
          />
        </View>
      </Modal>

      {/* Inspector Selection Modal */}
      <Modal
        visible={showInspectorModal}
        animationType="slide"
        onRequestClose={() => setShowInspectorModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Inspectors</Text>
            <TouchableOpacity onPress={() => setShowInspectorModal(false)}>
              <Ionicons name="close" size={28} color="#000000" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={inspectors}
            renderItem={({ item }) => renderInspectorItem(item)}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color="#CCCCCC" />
                <Text style={styles.emptyStateText}>
                  No inspectors available
                </Text>
              </View>
            }
          />
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setShowInspectorModal(false)}
            >
              <Text style={styles.doneButtonText}>
                Done ({selectedInspectors.length})
              </Text>
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
            <Text style={styles.successTitle}>Assignment Successful!</Text>
            <Text style={styles.successMessage}>
              {selectedInspectors.length} inspector(s) have been assigned to{" "}
              {selectedZone?.zoneCode}.
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    marginBottom: 12,
  },
  selectedCount: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#4CAF50",
  },
  selectButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  selectButtonText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#000000",
    flex: 1,
  },
  selectAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#4CAF50",
    gap: 8,
  },
  selectAllButtonText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#4CAF50",
    flex: 1,
  },
  selectedList: {
    marginTop: 12,
    gap: 8,
  },
  selectedItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectedItemText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#000000",
    flex: 1,
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
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
  },
  modalList: {
    flexGrow: 1,
    paddingVertical: 8,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  doneButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  doneButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    marginBottom: 4,
  },
  listItemSubtitle: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
  },
  listItemInfo: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#4CAF50",
    marginTop: 4,
  },
  inspectorItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  inspectorItemSelected: {
    backgroundColor: "#E8F5E9",
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#CCCCCC",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  inspectorInfo: {
    flex: 1,
  },
  inspectorName: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    marginBottom: 2,
  },
  inspectorDetails: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666666",
  },
  inspectorZone: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#FF9800",
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#999999",
    marginTop: 16,
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

export default AssignInspectorsToZone;
