import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
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
import MapView, { Marker, PROVIDER_DEFAULT, UrlTile } from "react-native-maps";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import parkingZoneService, {
  ParkingZone,
} from "../../services/parkingZoneService";

const ConfigureZone = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "active" | "inactive" | "issues"
  >("all");
  const [zones, setZones] = useState<ParkingZone[]>([]);
  const [filteredZones, setFilteredZones] = useState<ParkingZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedZone, setSelectedZone] = useState<ParkingZone | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [tempCoordinates, setTempCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Inactive reason states
  const [inactiveReason, setInactiveReason] = useState("");
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);

  const inactiveReasons = [
    "Operational & Maintenance",
    "Lack of parking inspectors",
    "Municipal Council Related Reasons",
    "Environmental & Infrastructure",
    "Community Related Reasons",
    "Social and Security Concerns",
  ];

  // Form states
  const [formData, setFormData] = useState({
    municipalCouncil: "",
    zoneCode: "",
    location: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    parkingRate: "",
    activeHours: "",
    totalParkingSpots: "",
  });

  // Load parking zones from AWS DynamoDB
  useEffect(() => {
    loadParkingZones();
  }, []);

  const loadParkingZones = async () => {
    try {
      setIsLoading(true);
      const zonesData = await parkingZoneService.getAllParkingZones();
      setZones(zonesData);
      setFilteredZones(zonesData);
    } catch (error: any) {
      console.error("Error loading parking zones:", error);
      Alert.alert("Error", error.message || "Failed to load parking zones");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter zones based on search query and selected filter
  useEffect(() => {
    let filtered = zones;

    // Apply status filter
    if (selectedFilter === "active") {
      filtered = filtered.filter((zone) => zone.status === "active");
    } else if (selectedFilter === "inactive") {
      filtered = filtered.filter((zone) => zone.status === "inactive");
    } else if (selectedFilter === "issues") {
      filtered = filtered.filter(
        (zone) => zone.status === "inactive" && zone.inactiveReason
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (zone) =>
          zone.municipalCouncil
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          zone.zoneCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          zone.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredZones(filtered);
  }, [searchQuery, selectedFilter, zones]);

  const resetForm = () => {
    setFormData({
      municipalCouncil: "",
      zoneCode: "",
      location: "",
      latitude: undefined,
      longitude: undefined,
      parkingRate: "",
      activeHours: "",
      totalParkingSpots: "",
    });
    setTempCoordinates(null);
  };

  const handleAddNewZone = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleSaveNewZone = async () => {
    if (
      !formData.municipalCouncil.trim() ||
      !formData.zoneCode.trim() ||
      !formData.location.trim() ||
      !formData.parkingRate.trim() ||
      !formData.activeHours.trim() ||
      !formData.totalParkingSpots.trim()
    ) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      Alert.alert("Validation Error", "Please select location on map");
      return;
    }

    try {
      setIsSaving(true);

      await parkingZoneService.addParkingZone({
        municipalCouncil: formData.municipalCouncil,
        zoneCode: formData.zoneCode,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        parkingRate: formData.parkingRate,
        activeHours: formData.activeHours,
        totalParkingSpots: formData.totalParkingSpots,
        status: "active",
      });

      await loadParkingZones();

      setShowAddModal(false);
      setSuccessMessage("Successfully added a new parking zone");
      setShowSuccessModal(true);
      resetForm();
    } catch (error: any) {
      console.error("Error adding parking zone:", error);
      Alert.alert("Error", error.message || "Failed to add parking zone");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditZone = (zone: ParkingZone) => {
    setSelectedZone(zone);
    setFormData({
      municipalCouncil: zone.municipalCouncil,
      zoneCode: zone.zoneCode,
      location: zone.location,
      latitude: zone.latitude,
      longitude: zone.longitude,
      parkingRate: zone.parkingRate,
      activeHours: zone.activeHours,
      totalParkingSpots: zone.totalParkingSpots,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (
      !formData.municipalCouncil.trim() ||
      !formData.zoneCode.trim() ||
      !formData.location.trim() ||
      !formData.parkingRate.trim() ||
      !formData.activeHours.trim() ||
      !formData.totalParkingSpots.trim()
    ) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      Alert.alert("Validation Error", "Please select location on map");
      return;
    }

    if (!selectedZone) return;

    try {
      setIsSaving(true);

      await parkingZoneService.updateParkingZone(selectedZone.id, {
        municipalCouncil: formData.municipalCouncil,
        zoneCode: formData.zoneCode,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        parkingRate: formData.parkingRate,
        activeHours: formData.activeHours,
        totalParkingSpots: formData.totalParkingSpots,
      });

      await loadParkingZones();

      setShowEditModal(false);
      setSuccessMessage("Successfully updated the parking zone details");
      setShowSuccessModal(true);
      resetForm();
      setSelectedZone(null);
    } catch (error: any) {
      console.error("Error updating parking zone:", error);
      Alert.alert("Error", error.message || "Failed to update parking zone");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteZone = (zone: ParkingZone) => {
    setSelectedZone(zone);
    setShowDeleteModal(true);
  };

  const handleOpenMapPicker = () => {
    // Initialize with existing coordinates or default to Colombo
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
    if (tempCoordinates) {
      setFormData({
        ...formData,
        latitude: tempCoordinates.latitude,
        longitude: tempCoordinates.longitude,
      });
    }
    setShowMapModal(false);
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setTempCoordinates({ latitude, longitude });
  };

  const confirmDelete = async () => {
    if (!selectedZone) return;

    try {
      setIsSaving(true);

      await parkingZoneService.deleteParkingZone(selectedZone.id);

      await loadParkingZones();

      setShowDeleteModal(false);
      setSuccessMessage("Successfully deleted the parking zone");
      setShowSuccessModal(true);
      setSelectedZone(null);
    } catch (error: any) {
      console.error("Error deleting parking zone:", error);
      Alert.alert("Error", error.message || "Failed to delete parking zone");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = (zone: ParkingZone) => {
    setSelectedZone(zone);
    if (zone.status === "active") {
      // Show inactive modal with reason selection
      setInactiveReason("");
      setShowInactiveModal(true);
    } else {
      // Directly activate the zone
      handleConfirmStatusChange("active");
    }
  };

  const handleConfirmStatusChange = async (
    newStatus: "active" | "inactive"
  ) => {
    if (!selectedZone) return;

    if (newStatus === "inactive" && !inactiveReason.trim()) {
      Alert.alert(
        "Validation Error",
        "Please select a reason for inactivation"
      );
      return;
    }

    try {
      setIsSaving(true);

      await parkingZoneService.updateZoneStatus(
        selectedZone.id,
        newStatus,
        newStatus === "inactive" ? inactiveReason : undefined
      );

      await loadParkingZones();

      setShowInactiveModal(false);
      setSuccessMessage(
        `Successfully ${
          newStatus === "active" ? "activated" : "inactivated"
        } the parking zone`
      );
      setShowSuccessModal(true);
      setSelectedZone(null);
      setInactiveReason("");
    } catch (error: any) {
      console.error("Error updating zone status:", error);
      Alert.alert("Error", error.message || "Failed to update zone status");
    } finally {
      setIsSaving(false);
    }
  };

  const renderZoneCard = ({ item }: { item: ParkingZone }) => (
    <View style={styles.zoneCard}>
      <View style={styles.zoneHeader}>
        <View style={styles.zoneInfo}>
          <Text style={styles.zoneMunicipal}>{item.municipalCouncil}</Text>
          <Text style={styles.zoneCode}>
            Zone {item.zoneCode} - {item.location}
          </Text>
          <Text style={styles.zoneRate}>Rs. {item.parkingRate}</Text>
          <Text style={styles.zoneHours}>{item.activeHours}</Text>
          <Text style={styles.zoneSpots}>
            Total Spots: {item.totalParkingSpots}
          </Text>
          {item.status === "inactive" && item.inactiveReason && (
            <View style={styles.reasonContainer}>
              <Ionicons name="information-circle" size={16} color="#F44336" />
              <Text style={styles.reasonText}>{item.inactiveReason}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => {
            Alert.alert("Actions", `Choose an action for ${item.zoneCode}`, [
              {
                text: "Edit",
                onPress: () => handleEditZone(item),
              },
              {
                text: "Delete",
                onPress: () => handleDeleteZone(item),
                style: "destructive",
              },
              {
                text: "Cancel",
                style: "cancel",
              },
            ]);
          }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.statusContainer}>
        <TouchableOpacity
          style={[
            styles.statusBadge,
            item.status === "active"
              ? styles.statusActive
              : styles.statusInactive,
          ]}
          onPress={() => handleToggleStatus(item)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.statusText,
              item.status === "active"
                ? styles.textActive
                : styles.textInactive,
            ]}
          >
            {item.status === "active" ? "Active" : "Inactive"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Parking Zones</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadParkingZones}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={24} color="#FFFFFF" />
          </TouchableOpacity>
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
              placeholder="Search Municipal Council"
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

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === "all" && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter("all")}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === "all" && styles.filterTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === "active" && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter("active")}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === "active" && styles.filterTextActive,
              ]}
            >
              Active
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === "inactive" && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter("inactive")}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === "inactive" && styles.filterTextActive,
              ]}
            >
              Inactive
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === "issues" && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter("issues")}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === "issues" && styles.filterTextActive,
              ]}
            >
              Issues
            </Text>
          </TouchableOpacity>
        </View>

        {/* Add New Zone Button */}
        <View style={styles.addZoneContainer}>
          <TouchableOpacity
            style={styles.addZoneButton}
            onPress={handleAddNewZone}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.addZoneText}>Add new zones</Text>
          </TouchableOpacity>
        </View>

        {/* Section Title */}
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Zone Lists</Text>
        </View>

        {/* Zones List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6FA882" />
            <Text style={styles.loadingText}>Loading parking zones...</Text>
          </View>
        ) : filteredZones.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No parking zones found</Text>
            {searchQuery.length > 0 && (
              <Text style={styles.emptySubtext}>Try adjusting your search</Text>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredZones}
            renderItem={renderZoneCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>

      {/* Add New Zone Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.modalBackButton}
                  onPress={() => setShowAddModal(false)}
                >
                  <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>New Parking Zones</Text>
                <View style={styles.modalSpacer} />
              </View>

              <ScrollView style={styles.modalForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Municipal Council</Text>
                  <View style={styles.dropdownContainer}>
                    <Picker
                      selectedValue={formData.municipalCouncil}
                      onValueChange={(value) =>
                        setFormData({ ...formData, municipalCouncil: value })
                      }
                      style={styles.picker}
                    >
                      <Picker.Item label="Select Municipal Council" value="" />
                      <Picker.Item
                        label="Colombo Municipal Council"
                        value="Colombo Municipal Council"
                      />
                      <Picker.Item
                        label="Kandy Municipal Council"
                        value="Kandy Municipal Council"
                      />
                      <Picker.Item
                        label="Galle Municipal Council"
                        value="Galle Municipal Council"
                      />
                      <Picker.Item
                        label="Negombo Municipal Council"
                        value="Negombo Municipal Council"
                      />
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Zone Code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter zone code"
                    placeholderTextColor="#999"
                    value={formData.zoneCode}
                    onChangeText={(text) =>
                      setFormData({ ...formData, zoneCode: text })
                    }
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Location</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter location"
                    placeholderTextColor="#999"
                    value={formData.location}
                    onChangeText={(text) =>
                      setFormData({ ...formData, location: text })
                    }
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Map Location *</Text>
                  <TouchableOpacity
                    style={styles.mapPickerButton}
                    onPress={handleOpenMapPicker}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="location" size={20} color="#093F86" />
                    <Text style={styles.mapPickerText}>
                      {formData.latitude && formData.longitude
                        ? `Selected: ${formData.latitude.toFixed(
                            4
                          )}, ${formData.longitude.toFixed(4)}`
                        : "Tap to select location on map"}
                    </Text>
                  </TouchableOpacity>
                  {formData.latitude && formData.longitude && (
                    <Text style={styles.coordinatesText}>
                      Lat: {formData.latitude.toFixed(6)}, Lng:{" "}
                      {formData.longitude.toFixed(6)}
                    </Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Parking Rate(Per Hour)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter parking rate"
                    placeholderTextColor="#999"
                    value={formData.parkingRate}
                    onChangeText={(text) =>
                      setFormData({ ...formData, parkingRate: text })
                    }
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Active Hours</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 8:00 AM - 6:00 PM"
                    placeholderTextColor="#999"
                    value={formData.activeHours}
                    onChangeText={(text) =>
                      setFormData({ ...formData, activeHours: text })
                    }
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Total Parking Spots</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter total parking spots"
                    placeholderTextColor="#999"
                    value={formData.totalParkingSpots}
                    onChangeText={(text) =>
                      setFormData({ ...formData, totalParkingSpots: text })
                    }
                    keyboardType="numeric"
                  />
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isSaving && styles.saveButtonDisabled,
                ]}
                onPress={handleSaveNewZone}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Details</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Zone Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.modalBackButton}
                  onPress={() => setShowEditModal(false)}
                >
                  <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Edit Parking Zone</Text>
                <View style={styles.modalSpacer} />
              </View>

              <ScrollView style={styles.modalForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Municipal Council</Text>
                  <View style={styles.dropdownContainer}>
                    <Picker
                      selectedValue={formData.municipalCouncil}
                      onValueChange={(value) =>
                        setFormData({ ...formData, municipalCouncil: value })
                      }
                      style={styles.picker}
                    >
                      <Picker.Item label="Select Municipal Council" value="" />
                      <Picker.Item
                        label="Colombo Municipal Council"
                        value="Colombo Municipal Council"
                      />
                      <Picker.Item
                        label="Kandy Municipal Council"
                        value="Kandy Municipal Council"
                      />
                      <Picker.Item
                        label="Galle Municipal Council"
                        value="Galle Municipal Council"
                      />
                      <Picker.Item
                        label="Negombo Municipal Council"
                        value="Negombo Municipal Council"
                      />
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Zone Code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter zone code"
                    placeholderTextColor="#999"
                    value={formData.zoneCode}
                    onChangeText={(text) =>
                      setFormData({ ...formData, zoneCode: text })
                    }
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Location</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter location"
                    placeholderTextColor="#999"
                    value={formData.location}
                    onChangeText={(text) =>
                      setFormData({ ...formData, location: text })
                    }
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Map Location *</Text>
                  <TouchableOpacity
                    style={styles.mapPickerButton}
                    onPress={handleOpenMapPicker}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="location" size={20} color="#093F86" />
                    <Text style={styles.mapPickerText}>
                      {formData.latitude && formData.longitude
                        ? `Selected: ${formData.latitude.toFixed(
                            4
                          )}, ${formData.longitude.toFixed(4)}`
                        : "Tap to select location on map"}
                    </Text>
                  </TouchableOpacity>
                  {formData.latitude && formData.longitude && (
                    <Text style={styles.coordinatesText}>
                      Lat: {formData.latitude.toFixed(6)}, Lng:{" "}
                      {formData.longitude.toFixed(6)}
                    </Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Parking Rate(Per Hour)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter parking rate"
                    placeholderTextColor="#999"
                    value={formData.parkingRate}
                    onChangeText={(text) =>
                      setFormData({ ...formData, parkingRate: text })
                    }
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Active Hours</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 8:00 AM - 6:00 PM"
                    placeholderTextColor="#999"
                    value={formData.activeHours}
                    onChangeText={(text) =>
                      setFormData({ ...formData, activeHours: text })
                    }
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Total Parking Spots</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter total parking spots"
                    placeholderTextColor="#999"
                    value={formData.totalParkingSpots}
                    onChangeText={(text) =>
                      setFormData({ ...formData, totalParkingSpots: text })
                    }
                    keyboardType="numeric"
                  />
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isSaving && styles.saveButtonDisabled,
                ]}
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
        </KeyboardAvoidingView>
      </Modal>

      {/* Inactive Modal with Reason Selection */}
      <Modal
        visible={showInactiveModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInactiveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.inactiveModalContent}>
            <Text style={styles.inactiveModalTitle}>
              Are you sure you want to Inactive this zone
            </Text>

            <View style={styles.reasonDropdownContainer}>
              <Text style={styles.reasonLabel}>Reason</Text>
              <View style={styles.dropdownWrapper}>
                <Picker
                  selectedValue={inactiveReason}
                  onValueChange={(value) => setInactiveReason(value)}
                  style={styles.reasonPicker}
                >
                  <Picker.Item label="Select a reason" value="" />
                  {inactiveReasons.map((reason, index) => (
                    <Picker.Item key={index} label={reason} value={reason} />
                  ))}
                </Picker>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.confirmInactiveButton,
                isSaving && styles.confirmInactiveButtonDisabled,
              ]}
              onPress={() => handleConfirmStatusChange("inactive")}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmInactiveButtonText}>Confirm</Text>
              )}
            </TouchableOpacity>

            {selectedZone && (
              <View style={styles.inactiveZoneInfo}>
                <Text style={styles.inactiveZoneName}>
                  {selectedZone.municipalCouncil}
                </Text>
                <Text style={styles.inactiveZoneCode}>
                  Zone {selectedZone.zoneCode} - {selectedZone.location}
                </Text>
                <Text style={styles.inactiveZoneRate}>
                  Rs. {selectedZone.parkingRate}
                </Text>
                <View style={[styles.statusBadge, styles.statusActive]}>
                  <Text style={[styles.statusText, styles.textActive]}>
                    Active
                  </Text>
                </View>
              </View>
            )}
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
            <Text style={styles.deleteModalTitle}>
              Are you sure you want to Delete this zone
            </Text>
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
                  styles.confirmButton,
                  isSaving && styles.confirmButtonDisabled,
                ]}
                onPress={confirmDelete}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
            {selectedZone && (
              <View style={styles.deleteZoneInfo}>
                <Text style={styles.deleteZoneName}>
                  {selectedZone.municipalCouncil}
                </Text>
                <Text style={styles.deleteZoneCode}>
                  Zone {selectedZone.zoneCode} - {selectedZone.location}
                </Text>
                <Text style={styles.deleteZoneRate}>
                  Rs. {selectedZone.parkingRate}
                </Text>
              </View>
            )}
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

      {/* Map Location Picker Modal */}
      <Modal
        visible={showMapModal}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowMapModal(false)}
      >
        <View style={styles.mapModalContainer}>
          <View style={styles.mapModalHeader}>
            <TouchableOpacity
              style={styles.mapModalBackButton}
              onPress={() => setShowMapModal(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.mapModalTitle}>Select Location on Map</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.mapModalContent}>
            {tempCoordinates && (
              <MapView
                style={styles.fullMap}
                provider={PROVIDER_DEFAULT}
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
                    <Ionicons name="location" size={40} color="#093F86" />
                  </View>
                </Marker>
              </MapView>
            )}

            <View style={styles.mapInfoCard}>
              <Text style={styles.mapInfoTitle}>Selected Coordinates</Text>
              {tempCoordinates && (
                <>
                  <Text style={styles.mapInfoText}>
                    Latitude: {tempCoordinates.latitude.toFixed(6)}
                  </Text>
                  <Text style={styles.mapInfoText}>
                    Longitude: {tempCoordinates.longitude.toFixed(6)}
                  </Text>
                </>
              )}
              <Text style={styles.mapInfoHint}>
                Tap anywhere on the map or drag the marker to select a location
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.confirmLocationButton}
            onPress={handleConfirmLocation}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            <Text style={styles.confirmLocationText}>Confirm Location</Text>
          </TouchableOpacity>
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
    paddingVertical: 16,
    paddingTop: 50,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  refreshButton: {
    padding: 4,
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
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterButtonActive: {
    backgroundColor: "#FFFFFF",
  },
  filterText: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    color: "#FFFFFF",
  },
  filterTextActive: {
    color: "#6FA882",
  },
  addZoneContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  addZoneButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#093F86",
    borderRadius: 10,
    paddingVertical: 14,
    gap: 8,
  },
  addZoneText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  sectionTitleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#666",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  zoneCard: {
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
  zoneHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  zoneInfo: {
    flex: 1,
  },
  zoneMunicipal: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    marginBottom: 4,
  },
  zoneCode: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    color: "#666",
    marginBottom: 4,
  },
  zoneRate: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#6FA882",
    marginBottom: 2,
  },
  zoneHours: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#999",
    marginBottom: 2,
  },
  zoneSpots: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#999",
  },
  reasonContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    gap: 6,
  },
  reasonText: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Poppins-Regular",
    color: "#F44336",
  },
  menuButton: {
    padding: 4,
  },
  statusContainer: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusActive: {
    backgroundColor: "#6FA882",
  },
  statusInactive: {
    backgroundColor: "#E57373",
  },
  statusText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
  },
  textActive: {
    color: "#FFFFFF",
  },
  textInactive: {
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: "90%",
    maxHeight: "85%",
    padding: 0,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#6FA882",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalBackButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    flex: 1,
    textAlign: "center",
  },
  modalSpacer: {
    width: 32,
  },
  modalForm: {
    padding: 20,
    maxHeight: 450,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#000",
  },
  dropdownContainer: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  saveButton: {
    backgroundColor: "#093F86",
    marginHorizontal: 20,
    marginVertical: 20,
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
  // Inactive modal styles
  inactiveModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: "85%",
    padding: 24,
    alignItems: "center",
  },
  inactiveModalTitle: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#000",
    textAlign: "center",
    marginBottom: 20,
  },
  reasonDropdownContainer: {
    width: "100%",
    marginBottom: 20,
  },
  reasonLabel: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#333",
    marginBottom: 8,
  },
  dropdownWrapper: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    overflow: "hidden",
  },
  reasonPicker: {
    height: 50,
    width: "100%",
  },
  confirmInactiveButton: {
    backgroundColor: "#093F86",
    paddingVertical: 12,
    paddingHorizontal: 48,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  confirmInactiveButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  confirmInactiveButtonDisabled: {
    opacity: 0.6,
  },
  inactiveZoneInfo: {
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  inactiveZoneName: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    marginBottom: 4,
  },
  inactiveZoneCode: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#666",
    marginBottom: 4,
  },
  inactiveZoneRate: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#6FA882",
    marginBottom: 8,
  },
  // Delete modal styles
  deleteModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: "80%",
    padding: 24,
    alignItems: "center",
  },
  deleteModalTitle: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#000",
    textAlign: "center",
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#E0E0E0",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#666",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#093F86",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  deleteZoneInfo: {
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  deleteZoneName: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    marginBottom: 4,
  },
  deleteZoneCode: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#666",
    marginBottom: 4,
  },
  deleteZoneRate: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#6FA882",
  },
  // Success modal styles
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
    marginBottom: 24,
  },
  successButton: {
    backgroundColor: "#6FA882",
    paddingVertical: 12,
    paddingHorizontal: 48,
    borderRadius: 10,
  },
  successButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  // Map picker button styles
  mapPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  mapPickerText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#333",
  },
  coordinatesText: {
    fontSize: 11,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginTop: 6,
    paddingLeft: 4,
  },
  // Map modal styles
  mapModalContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  mapModalHeader: {
    backgroundColor: "#093F86",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
  },
  mapModalBackButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  mapModalTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  mapModalContent: {
    flex: 1,
    position: "relative",
  },
  fullMap: {
    flex: 1,
  },
  customMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  mapInfoCard: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  mapInfoTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    marginBottom: 8,
  },
  mapInfoText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#333",
    marginBottom: 4,
  },
  mapInfoHint: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginTop: 8,
    fontStyle: "italic",
  },
  confirmLocationButton: {
    backgroundColor: "#093F86",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 10,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmLocationText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
});

export default ConfigureZone;
