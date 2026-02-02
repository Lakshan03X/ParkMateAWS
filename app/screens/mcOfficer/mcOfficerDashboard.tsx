import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
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
import inspectorService, { Inspector } from "../../services/inspectorService";
import parkingZoneService, {
  ParkingZone,
} from "../../services/parkingZoneService";

// Assignment interface for tracking inspector assignments
export interface InspectorAssignment {
  id: string;
  inspectorId: string;
  inspectorName: string;
  zoneId: string;
  zoneName: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  status: "active" | "completed" | "cancelled";
  createdAt?: Date;
}

const MCOfficerDashboard = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [allInspectors, setAllInspectors] = useState<Inspector[]>([]); // All inspectors for picker
  const [parkingZones, setParkingZones] = useState<ParkingZone[]>([]);
  const [assignments, setAssignments] = useState<InspectorAssignment[]>([]);
  const [filteredInspectors, setFilteredInspectors] = useState<Inspector[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedAssignment, setSelectedAssignment] =
    useState<InspectorAssignment | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Date/Time picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Form states for assignment
  const [assignmentData, setAssignmentData] = useState({
    selectedInspectorId: "",
    selectedZoneId: "",
    startDate: new Date(),
    endDate: new Date(),
    startTime: "08:00",
    endTime: "17:00",
  });

  useEffect(() => {
    loadInspectors();
    loadParkingZones();
  }, []);

  const loadInspectors = async () => {
    try {
      setIsLoading(true);
      const data = await inspectorService.getAllInspectors();

      console.log("📋 Total inspectors from AWS DynamoDB:", data.length);
      console.log("📋 Selected Council:", params.selectedCouncil);
      console.log(
        "📋 All Inspector details:",
        data.map((i) => ({
          name: i.name,
          council: i.municipalCouncil,
          zone: i.assignedZone,
          isAssigned: i.isAssigned,
        }))
      );

      // Store ALL inspectors for the picker dropdown
      setAllInspectors(data);

      // Show only assigned inspectors (those with a zone assignment)
      // Temporarily removed council filter to show ALL assigned inspectors
      const assignedInspectors = data.filter(
        (inspector) =>
          inspector.isAssigned === true ||
          (inspector.assignedZone && inspector.assignedZone.trim() !== "")
      );

      console.log(
        "📋 Total assigned inspectors (all councils):",
        assignedInspectors.length
      );
      console.log(
        "📋 Assigned inspector details:",
        assignedInspectors.map((i) => ({
          name: i.name,
          zone: i.assignedZone,
          council: i.municipalCouncil,
        }))
      );

      setInspectors(assignedInspectors);
      setFilteredInspectors(assignedInspectors);
    } catch (error: any) {
      console.error("Error loading inspectors:", error);
      Alert.alert("Error", "Failed to load parking inspectors");
    } finally {
      setIsLoading(false);
    }
  };

  const loadParkingZones = async () => {
    try {
      const zones = await parkingZoneService.getAllZones();
      setParkingZones(zones);
    } catch (error: any) {
      console.error("Error loading parking zones:", error);
      Alert.alert("Error", "Failed to load parking zones");
    }
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = inspectors.filter(
        (inspector) =>
          inspector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (inspector.assignedZone &&
            inspector.assignedZone
              .toLowerCase()
              .includes(searchQuery.toLowerCase()))
      );
      setFilteredInspectors(filtered);
    } else {
      setFilteredInspectors(inspectors);
    }
  }, [searchQuery, inspectors]);

  const toggleInspectorStatus = async (inspector: Inspector) => {
    try {
      const newStatus = inspector.status === "online" ? "offline" : "online";

      await inspectorService.updateInspector(inspector.id, {
        status: newStatus,
      });

      // Refresh the list
      await loadInspectors();
    } catch (error: any) {
      console.error("Error updating inspector status:", error);
      Alert.alert("Error", "Failed to update inspector status");
    }
  };

  const resetAssignmentForm = () => {
    setAssignmentData({
      selectedInspectorId: "",
      selectedZoneId: "",
      startDate: new Date(),
      endDate: new Date(),
      startTime: "08:00",
      endTime: "17:00",
    });
  };

  const handleOpenAssignModal = () => {
    resetAssignmentForm();
    setShowAssignModal(true);
  };

  const handleSaveAssignment = async () => {
    if (
      !assignmentData.selectedInspectorId.trim() ||
      !assignmentData.selectedZoneId.trim()
    ) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    try {
      setIsSaving(true);

      const selectedInspector = allInspectors.find(
        (i) => i.id === assignmentData.selectedInspectorId
      );
      const selectedZone = parkingZones.find(
        (z) => z.id === assignmentData.selectedZoneId
      );

      if (!selectedInspector || !selectedZone) {
        Alert.alert("Error", "Invalid inspector or zone selection");
        return;
      }

      const newAssignment: InspectorAssignment = {
        id: `assignment_${Date.now()}`,
        inspectorId: assignmentData.selectedInspectorId,
        inspectorName: selectedInspector.name,
        zoneId: assignmentData.selectedZoneId,
        zoneName: selectedZone.location || selectedZone.zoneCode,
        startDate: assignmentData.startDate,
        endDate: assignmentData.endDate,
        startTime: assignmentData.startTime,
        endTime: assignmentData.endTime,
        status: "active",
        createdAt: new Date(),
      };

      // Update inspector with zone assignment
      await inspectorService.updateInspector(selectedInspector.id, {
        assignedZone: selectedZone.zoneCode,
        isAssigned: true,
      });

      console.log("✅ Inspector assigned:", {
        inspectorId: selectedInspector.id,
        inspectorName: selectedInspector.name,
        zoneCode: selectedZone.zoneCode,
        isAssigned: true,
      });

      setAssignments((prev) => [...prev, newAssignment]);
      await loadInspectors();

      setShowAssignModal(false);
      setSuccessMessage("Successfully assigned parking inspector to zone");
      setShowSuccessModal(true);
      resetAssignmentForm();
    } catch (error: any) {
      console.error("Error assigning inspector:", error);
      Alert.alert("Error", error.message || "Failed to assign inspector");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditAssignment = (inspector: Inspector) => {
    const assignment = assignments.find(
      (a) => a.inspectorId === inspector.id && a.status === "active"
    );

    if (assignment) {
      setSelectedAssignment(assignment);
      setAssignmentData({
        selectedInspectorId: inspector.id,
        selectedZoneId: assignment.zoneId,
        startDate: new Date(assignment.startDate),
        endDate: new Date(assignment.endDate),
        startTime: assignment.startTime,
        endTime: assignment.endTime,
      });
      setShowEditModal(true);
    } else {
      // Create new assignment for this inspector
      setAssignmentData({
        selectedInspectorId: inspector.id,
        selectedZoneId: "",
        startDate: new Date(),
        endDate: new Date(),
        startTime: "08:00",
        endTime: "17:00",
      });
      setShowEditModal(true);
    }
  };

  const handleSaveEdit = async () => {
    if (
      !assignmentData.selectedInspectorId.trim() ||
      !assignmentData.selectedZoneId.trim()
    ) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    try {
      setIsSaving(true);

      const selectedInspector = inspectors.find(
        (i) => i.id === assignmentData.selectedInspectorId
      );
      const selectedZone = parkingZones.find(
        (z) => z.id === assignmentData.selectedZoneId
      );

      if (!selectedInspector || !selectedZone) {
        Alert.alert("Error", "Invalid inspector or zone selection");
        return;
      }

      // Update inspector with new zone assignment
      await inspectorService.updateInspector(selectedInspector.id, {
        assignedZone: selectedZone.zoneCode,
        isAssigned: true,
      });

      if (selectedAssignment) {
        // Update existing assignment
        const updatedAssignments = assignments.map((a) =>
          a.id === selectedAssignment.id
            ? {
                ...a,
                zoneId: assignmentData.selectedZoneId,
                zoneName: selectedZone.location || selectedZone.zoneCode,
                startDate: assignmentData.startDate,
                endDate: assignmentData.endDate,
                startTime: assignmentData.startTime,
                endTime: assignmentData.endTime,
              }
            : a
        );
        setAssignments(updatedAssignments);
      }

      await loadInspectors();

      setShowEditModal(false);
      setSuccessMessage("Successfully updated inspector assignment");
      setShowSuccessModal(true);
      setSelectedAssignment(null);
      resetAssignmentForm();
    } catch (error: any) {
      console.error("Error updating assignment:", error);
      Alert.alert("Error", error.message || "Failed to update assignment");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAssignment = (inspector: Inspector) => {
    setSelectedAssignment({
      id: `temp_${inspector.id}`,
      inspectorId: inspector.id,
      inspectorName: inspector.name,
      zoneId: "",
      zoneName: inspector.assignedZone || "",
      startDate: new Date(),
      endDate: new Date(),
      startTime: "",
      endTime: "",
      status: "active",
    });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedAssignment) return;

    try {
      setIsSaving(true);

      // Remove zone assignment from inspector
      await inspectorService.updateInspector(selectedAssignment.inspectorId, {
        assignedZone: "",
        isAssigned: false,
      });

      // Remove from assignments list
      setAssignments((prev) =>
        prev.filter((a) => a.inspectorId !== selectedAssignment.inspectorId)
      );

      await loadInspectors();

      setShowDeleteModal(false);
      setSuccessMessage("Successfully removed inspector assignment");
      setShowSuccessModal(true);
      setSelectedAssignment(null);
    } catch (error: any) {
      console.error("Error deleting assignment:", error);
      Alert.alert("Error", error.message || "Failed to delete assignment");
    } finally {
      setIsSaving(false);
    }
  };

  const renderInspectorCard = ({ item }: { item: Inspector }) => (
    <View style={styles.inspectorCard}>
      <View style={styles.cardContent}>
        <View style={styles.inspectorInfo}>
          <Text style={styles.inspectorName}>{item.name}</Text>
          <Text style={styles.inspectorDetail}>
            Zone: {item.assignedZone || "Not Assigned"}
          </Text>
          <Text style={styles.inspectorDetail}>
            {item.municipalCouncil || "N/A"}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            item.status === "online"
              ? styles.statusOnline
              : styles.statusOffline,
          ]}
        >
          <Text style={styles.statusText}>
            {item.status === "online" ? "Online" : "Offline"}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditAssignment(item)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteAssignment(item)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const onDutyCount = inspectors.filter((i) => i.status === "online").length;
  const offDutyCount = inspectors.filter((i) => i.status === "offline").length;

  return (
    <View style={styles.container}>
      {/* Top Safe Area Background */}
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        {/* Fixed background color */}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push("/loginSelection")}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Municipal Council</Text>
            <Text style={styles.headerTitle}>Officer Panel</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#666"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Assigned Parking Inspectors"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Assign Button */}
        <View style={styles.assignButtonContainer}>
          <TouchableOpacity
            style={styles.assignButton}
            onPress={handleOpenAssignModal}
            activeOpacity={0.8}
          >
            <Text style={styles.assignButtonText}>
              Assign parking inspectors
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section Title */}
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>
            Assigned Parking Inspectors List
          </Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={[styles.statDot, styles.onDutyDot]} />
              <Text style={styles.statText}>Online: {onDutyCount}</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statDot, styles.offDutyDot]} />
              <Text style={styles.statText}>Offline: {offDutyCount}</Text>
            </View>
          </View>
        </View>

        {/* Inspectors List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A7C5B" />
            <Text style={styles.loadingText}>Loading inspectors...</Text>
          </View>
        ) : filteredInspectors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No parking inspectors found</Text>
            {searchQuery.length > 0 && (
              <Text style={styles.emptySubtext}>Try adjusting your search</Text>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredInspectors}
            renderItem={renderInspectorCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>

      {/* Assign Inspector Modal */}
      <Modal
        visible={showAssignModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalBackButton}
                onPress={() => setShowAssignModal(false)}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Assign Inspector</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowAssignModal(false)}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Inspector</Text>
                <View style={styles.dropdownContainer}>
                  <Picker
                    selectedValue={assignmentData.selectedInspectorId}
                    onValueChange={(value) =>
                      setAssignmentData({
                        ...assignmentData,
                        selectedInspectorId: value,
                      })
                    }
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Inspector" value="" />
                    {allInspectors.map((inspector) => (
                      <Picker.Item
                        key={inspector.id}
                        label={inspector.name}
                        value={inspector.id}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Zone</Text>
                <View style={styles.dropdownContainer}>
                  <Picker
                    selectedValue={assignmentData.selectedZoneId}
                    onValueChange={(value) =>
                      setAssignmentData({
                        ...assignmentData,
                        selectedZoneId: value,
                      })
                    }
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Zone" value="" />
                    {parkingZones.map((zone) => (
                      <Picker.Item
                        key={zone.id}
                        label={`${zone.zoneCode} - ${zone.location}`}
                        value={zone.id}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Start Date</Text>
                <TouchableOpacity
                  onPress={() => setShowStartDatePicker(true)}
                  style={styles.datePickerButton}
                >
                  <Text style={styles.datePickerText}>
                    {assignmentData.startDate.toDateString()}
                  </Text>
                </TouchableOpacity>
                {showStartDatePicker && (
                  <DateTimePicker
                    value={assignmentData.startDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, date) => {
                      setShowStartDatePicker(false);
                      if (date) {
                        setAssignmentData({
                          ...assignmentData,
                          startDate: date,
                        });
                      }
                    }}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>End Date</Text>
                <TouchableOpacity
                  onPress={() => setShowEndDatePicker(true)}
                  style={styles.datePickerButton}
                >
                  <Text style={styles.datePickerText}>
                    {assignmentData.endDate.toDateString()}
                  </Text>
                </TouchableOpacity>
                {showEndDatePicker && (
                  <DateTimePicker
                    value={assignmentData.endDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, date) => {
                      setShowEndDatePicker(false);
                      if (date) {
                        setAssignmentData({
                          ...assignmentData,
                          endDate: date,
                        });
                      }
                    }}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Start Time</Text>
                <TouchableOpacity
                  onPress={() => setShowStartTimePicker(true)}
                  style={styles.datePickerButton}
                >
                  <Text style={styles.datePickerText}>
                    {assignmentData.startTime}
                  </Text>
                </TouchableOpacity>
                {showStartTimePicker && (
                  <DateTimePicker
                    value={new Date()}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, time) => {
                      setShowStartTimePicker(false);
                      if (time) {
                        setAssignmentData({
                          ...assignmentData,
                          startTime: time.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          }),
                        });
                      }
                    }}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>End Time</Text>
                <TouchableOpacity
                  onPress={() => setShowEndTimePicker(true)}
                  style={styles.datePickerButton}
                >
                  <Text style={styles.datePickerText}>
                    {assignmentData.endTime}
                  </Text>
                </TouchableOpacity>
                {showEndTimePicker && (
                  <DateTimePicker
                    value={new Date()}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, time) => {
                      setShowEndTimePicker(false);
                      if (time) {
                        setAssignmentData({
                          ...assignmentData,
                          endTime: time.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          }),
                        });
                      }
                    }}
                  />
                )}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSaveAssignment}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Assign Inspector</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Inspector Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalBackButton}
                onPress={() => setShowEditModal(false)}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Assignment</Text>
              <View style={styles.modalSpacer} />
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Inspector</Text>
                <View style={styles.dropdownContainer}>
                  <Picker
                    selectedValue={assignmentData.selectedInspectorId}
                    onValueChange={(value) =>
                      setAssignmentData({
                        ...assignmentData,
                        selectedInspectorId: value,
                      })
                    }
                    style={styles.picker}
                    enabled={false}
                  >
                    <Picker.Item label="Select Inspector" value="" />
                    {inspectors.map((inspector) => (
                      <Picker.Item
                        key={inspector.id}
                        label={inspector.name}
                        value={inspector.id}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Zone</Text>
                <View style={styles.dropdownContainer}>
                  <Picker
                    selectedValue={assignmentData.selectedZoneId}
                    onValueChange={(value) =>
                      setAssignmentData({
                        ...assignmentData,
                        selectedZoneId: value,
                      })
                    }
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Zone" value="" />
                    {parkingZones.map((zone) => (
                      <Picker.Item
                        key={zone.id}
                        label={`${zone.zoneCode} - ${zone.location}`}
                        value={zone.id}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Start Date</Text>
                <TouchableOpacity
                  onPress={() => setShowStartDatePicker(true)}
                  style={styles.datePickerButton}
                >
                  <Text style={styles.datePickerText}>
                    {assignmentData.startDate.toDateString()}
                  </Text>
                </TouchableOpacity>
                {showStartDatePicker && (
                  <DateTimePicker
                    value={assignmentData.startDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, date) => {
                      setShowStartDatePicker(false);
                      if (date) {
                        setAssignmentData({
                          ...assignmentData,
                          startDate: date,
                        });
                      }
                    }}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>End Date</Text>
                <TouchableOpacity
                  onPress={() => setShowEndDatePicker(true)}
                  style={styles.datePickerButton}
                >
                  <Text style={styles.datePickerText}>
                    {assignmentData.endDate.toDateString()}
                  </Text>
                </TouchableOpacity>
                {showEndDatePicker && (
                  <DateTimePicker
                    value={assignmentData.endDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, date) => {
                      setShowEndDatePicker(false);
                      if (date) {
                        setAssignmentData({
                          ...assignmentData,
                          endDate: date,
                        });
                      }
                    }}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Start Time</Text>
                <TouchableOpacity
                  onPress={() => setShowStartTimePicker(true)}
                  style={styles.datePickerButton}
                >
                  <Text style={styles.datePickerText}>
                    {assignmentData.startTime}
                  </Text>
                </TouchableOpacity>
                {showStartTimePicker && (
                  <DateTimePicker
                    value={new Date()}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, time) => {
                      setShowStartTimePicker(false);
                      if (time) {
                        setAssignmentData({
                          ...assignmentData,
                          startTime: time.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          }),
                        });
                      }
                    }}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>End Time</Text>
                <TouchableOpacity
                  onPress={() => setShowEndTimePicker(true)}
                  style={styles.datePickerButton}
                >
                  <Text style={styles.datePickerText}>
                    {assignmentData.endTime}
                  </Text>
                </TouchableOpacity>
                {showEndTimePicker && (
                  <DateTimePicker
                    value={new Date()}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, time) => {
                      setShowEndTimePicker(false);
                      if (time) {
                        setAssignmentData({
                          ...assignmentData,
                          endTime: time.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          }),
                        });
                      }
                    }}
                  />
                )}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSaveEdit}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <Ionicons name="warning" size={64} color="#E57373" />
            <Text style={styles.deleteModalTitle}>
              Are you sure you want to delete this assignment?
            </Text>
            {selectedAssignment && (
              <View style={styles.deleteInfo}>
                <Text style={styles.deleteInfoText}>
                  Inspector: {selectedAssignment.inspectorName}
                </Text>
                <Text style={styles.deleteInfoText}>
                  Zone: {selectedAssignment.zoneName}
                </Text>
              </View>
            )}
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDeleteModal(false)}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmDeleteButton,
                  isSaving && styles.confirmDeleteButtonDisabled,
                ]}
                onPress={confirmDelete}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmDeleteButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
              <Ionicons name="checkmark-circle" size={80} color="#6FA882" />
            </View>
            <Text style={styles.successTitle}>Success!</Text>
            <Text style={styles.successMessage}>{successMessage}</Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => setShowSuccessModal(false)}
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
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 55,
    paddingVertical: 16,
  },
  menuButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    lineHeight: 24,
  },
  headerSpacer: {
    width: 36,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#000",
  },
  assignButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  assignButton: {
    backgroundColor: "#093F86",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  assignButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  sectionTitleContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#333",
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  onDutyDot: {
    backgroundColor: "#6FA882",
  },
  offDutyDot: {
    backgroundColor: "#E57373",
  },
  statText: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  inspectorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  inspectorInfo: {
    flex: 1,
  },
  inspectorName: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    marginBottom: 4,
  },
  inspectorDetail: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusOnline: {
    backgroundColor: "#6FA882",
  },
  statusOffline: {
    backgroundColor: "#E57373",
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    color: "#FFFFFF",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#4A90E2",
  },
  deleteButton: {
    backgroundColor: "#E57373",
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#999",
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#4A7C5B",
    marginHorizontal: -16,
    marginTop: -16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginBottom: 16,
  },
  modalBackButton: {
    padding: 4,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  modalSpacer: {
    width: 24,
  },
  modalForm: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#333",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 20,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#000",
  },
  dropdownContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 5,
  },
  picker: {
    height: 40,
    color: "#000",
    padding: 8,
  },
  datePickerButton: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "center",
  },
  datePickerText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#000",
  },
  saveButton: {
    backgroundColor: "#6FA882",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#A5D6A7",
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  successModalContent: {
    width: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  successButton: {
    backgroundColor: "#6FA882",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  successButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  deleteModalContent: {
    width: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  deleteModalTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#333",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  deleteInfo: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    width: "100%",
    marginBottom: 16,
  },
  deleteInfoText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginBottom: 4,
  },
  deleteModalButtons: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#E0E0E0",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#666",
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: "#E57373",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmDeleteButtonDisabled: {
    backgroundColor: "#FFCDD2",
  },
  confirmDeleteButtonText: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
});

export default MCOfficerDashboard;
