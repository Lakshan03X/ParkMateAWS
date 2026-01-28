import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import inspectorService, { Inspector } from "../../services/inspectorService";

const MCInspectorManage = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "online" | "onDuty" | "offDuty"
  >("all");
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [filteredInspectors, setFilteredInspectors] = useState<Inspector[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedInspector, setSelectedInspector] = useState<Inspector | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    inspectorId: "",
    municipalCouncil: "",
  });

  // Load inspectors from Firebase
  useEffect(() => {
    loadInspectors();
    // Set up real-time refresh every 5 seconds to sync with inspector dashboard
    const interval = setInterval(loadInspectors, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadInspectors = async () => {
    try {
      setIsLoading(true);
      const inspectorsData = await inspectorService.getAllInspectors();
      setInspectors(inspectorsData);
      setFilteredInspectors(inspectorsData);
    } catch (error: any) {
      console.error("Error loading inspectors:", error);
      // Only show alert on initial load, not on refresh
      if (inspectors.length === 0) {
        Alert.alert("Error", error.message || "Failed to load inspectors");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Filter inspectors based on search query and selected filter
  useEffect(() => {
    let filtered = inspectors;

    // Apply status filter
    if (selectedFilter === "online") {
      filtered = filtered.filter((inspector) => inspector.status === "online");
    } else if (selectedFilter === "onDuty") {
      filtered = filtered.filter(
        (inspector) =>
          inspector.status === "online" && inspector.isAssigned !== false
      );
    } else if (selectedFilter === "offDuty") {
      filtered = filtered.filter((inspector) => inspector.status === "offline");
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (inspector) =>
          inspector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inspector.mobileNumber.includes(searchQuery) ||
          (inspector.inspectorId &&
            inspector.inspectorId
              .toLowerCase()
              .includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredInspectors(filtered);
  }, [searchQuery, selectedFilter, inspectors]);

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      phoneNumber: "",
      inspectorId: "",
      municipalCouncil: "",
    });
  };

  const handleAddNewInspector = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleSaveNewInspector = async () => {
    if (
      !formData.fullName.trim() ||
      !formData.phoneNumber.trim() ||
      !formData.inspectorId.trim() ||
      !formData.municipalCouncil.trim()
    ) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    try {
      setIsSaving(true);

      await inspectorService.addInspector({
        name: formData.fullName,
        mobileNumber: formData.phoneNumber,
        email: formData.email,
        inspectorId: formData.inspectorId,
        municipalCouncil: formData.municipalCouncil,
        status: "pending", // New inspectors start as pending until system admin assigns them
        isAssigned: false,
      });

      await loadInspectors();

      setShowAddModal(false);
      setSuccessMessage("Successfully added a new parking inspector");
      setShowSuccessModal(true);
      resetForm();
    } catch (error: any) {
      console.error("Error adding inspector:", error);
      Alert.alert("Error", error.message || "Failed to add inspector");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditInspector = (inspector: Inspector) => {
    setSelectedInspector(inspector);
    setFormData({
      fullName: inspector.name,
      email: inspector.email || "",
      phoneNumber: inspector.mobileNumber,
      inspectorId: inspector.inspectorId || "",
      municipalCouncil: inspector.municipalCouncil || "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (
      !formData.fullName.trim() ||
      !formData.phoneNumber.trim() ||
      !formData.inspectorId.trim()
    ) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    if (!selectedInspector) return;

    try {
      setIsSaving(true);

      await inspectorService.updateInspector(selectedInspector.id, {
        name: formData.fullName,
        mobileNumber: formData.phoneNumber,
        email: formData.email,
        inspectorId: formData.inspectorId,
        municipalCouncil: formData.municipalCouncil,
      });

      await loadInspectors();

      setShowEditModal(false);
      setSuccessMessage("Successfully updated the inspector details");
      setShowSuccessModal(true);
      resetForm();
      setSelectedInspector(null);
    } catch (error: any) {
      console.error("Error updating inspector:", error);
      Alert.alert("Error", error.message || "Failed to update inspector");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteInspector = (inspector: Inspector) => {
    setSelectedInspector(inspector);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedInspector) return;

    try {
      setIsSaving(true);

      await inspectorService.deleteInspector(selectedInspector.id);

      await loadInspectors();

      setShowDeleteModal(false);
      setSuccessMessage("Successfully deleted the inspector");
      setShowSuccessModal(true);
      setSelectedInspector(null);
    } catch (error: any) {
      console.error("Error deleting inspector:", error);
      Alert.alert("Error", error.message || "Failed to delete inspector");
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadgeStyle = (inspector: Inspector) => {
    if (inspector.status === "pending") {
      return styles.statusPending;
    } else if (inspector.status === "online") {
      return styles.statusOnDuty;
    } else {
      return styles.statusOffDuty;
    }
  };

  const getStatusText = (inspector: Inspector) => {
    if (inspector.status === "pending") {
      return "Pending";
    } else if (inspector.status === "online") {
      return "On duty";
    } else {
      return "Off duty";
    }
  };

  const renderInspectorCard = ({ item }: { item: Inspector }) => (
    <View style={styles.inspectorCard}>
      <View style={styles.cardContent}>
        <View style={styles.inspectorInfo}>
          <Text style={styles.inspectorName}>{item.name}</Text>
          {item.inspectorId && (
            <Text style={styles.inspectorDetail}>
              Zone {item.assignedZone || "A"} -{" "}
              {item.municipalCouncil || "School Lane"}
            </Text>
          )}
          <Text style={styles.inspectorDetail}>
            {item.municipalCouncil || "Colombo MC"}
          </Text>
        </View>

        <View style={[styles.statusBadge, getStatusBadgeStyle(item)]}>
          <Text style={styles.statusText}>{getStatusText(item)}</Text>
        </View>
      </View>

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditInspector(item)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteInspector(item)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Safe Area Background */}
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Parking Inspectors</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadInspectors}
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
              placeholder="Search Parking Inspectors"
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
              selectedFilter === "online" && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter("online")}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === "online" && styles.filterTextActive,
              ]}
            >
              Online
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === "onDuty" && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter("onDuty")}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === "onDuty" && styles.filterTextActive,
              ]}
            >
              On Duty
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === "offDuty" && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter("offDuty")}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === "offDuty" && styles.filterTextActive,
              ]}
            >
              Off Duty
            </Text>
          </TouchableOpacity>
        </View>

        {/* Add New Inspector Button */}
        <View style={styles.addInspectorContainer}>
          <TouchableOpacity
            style={styles.addInspectorButton}
            onPress={handleAddNewInspector}
            activeOpacity={0.8}
          >
            <Text style={styles.addInspectorText}>
              Add new parking inspectors
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section Title */}
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Inspectors List</Text>
        </View>

        {/* Inspectors List */}
        {isLoading && inspectors.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6FA882" />
            <Text style={styles.loadingText}>Loading inspectors...</Text>
          </View>
        ) : filteredInspectors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No inspectors found</Text>
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

      {/* Add New Inspector Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalBackButton}
                onPress={() => setShowAddModal(false)}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add Parking Inspector</Text>
              <View style={styles.modalSpacer} />
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  placeholderTextColor="#999"
                  value={formData.fullName}
                  onChangeText={(text) =>
                    setFormData({ ...formData, fullName: text })
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email"
                  placeholderTextColor="#999"
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, email: text })
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter phone number"
                  placeholderTextColor="#999"
                  value={formData.phoneNumber}
                  onChangeText={(text) =>
                    setFormData({ ...formData, phoneNumber: text })
                  }
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Inspector Id</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter inspector ID"
                  placeholderTextColor="#999"
                  value={formData.inspectorId}
                  onChangeText={(text) =>
                    setFormData({ ...formData, inspectorId: text })
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Registered Municipal Council</Text>
                <View style={styles.dropdownContainer}>
                  <Picker
                    selectedValue={formData.municipalCouncil}
                    onValueChange={(value) =>
                      setFormData({ ...formData, municipalCouncil: value })
                    }
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Council" value="" />
                    <Picker.Item label="Colombo MC" value="Colombo MC" />
                    <Picker.Item label="Kandy MC" value="Kandy MC" />
                    <Picker.Item label="Galle MC" value="Galle MC" />
                    <Picker.Item label="Negombo MC" value="Negombo MC" />
                    <Picker.Item label="Dehiwala MC" value="Dehiwala MC" />
                    <Picker.Item label="Kesbewa MC" value="Kesbewa MC" />
                    <Picker.Item label="Maharagama MC" value="Maharagama MC" />
                  </Picker>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSaveNewInspector}
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
              <Text style={styles.modalTitle}>Edit Inspector</Text>
              <View style={styles.modalSpacer} />
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  placeholderTextColor="#999"
                  value={formData.fullName}
                  onChangeText={(text) =>
                    setFormData({ ...formData, fullName: text })
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email"
                  placeholderTextColor="#999"
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, email: text })
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter phone number"
                  placeholderTextColor="#999"
                  value={formData.phoneNumber}
                  onChangeText={(text) =>
                    setFormData({ ...formData, phoneNumber: text })
                  }
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Inspector Id</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter inspector ID"
                  placeholderTextColor="#999"
                  value={formData.inspectorId}
                  onChangeText={(text) =>
                    setFormData({ ...formData, inspectorId: text })
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Registered Municipal Council</Text>
                <View style={styles.dropdownContainer}>
                  <Picker
                    selectedValue={formData.municipalCouncil}
                    onValueChange={(value) =>
                      setFormData({ ...formData, municipalCouncil: value })
                    }
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Council" value="" />
                    <Picker.Item label="Colombo MC" value="Colombo MC" />
                    <Picker.Item label="Kandy MC" value="Kandy MC" />
                    <Picker.Item label="Galle MC" value="Galle MC" />
                    <Picker.Item label="Negombo MC" value="Negombo MC" />
                    <Picker.Item label="Dehiwala MC" value="Dehiwala MC" />
                    <Picker.Item label="Kesbewa MC" value="Kesbewa MC" />
                    <Picker.Item label="Maharagama MC" value="Maharagama MC" />
                  </Picker>
                </View>
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
            <Text style={styles.deleteModalTitle}>
              Are you sure you want to Delete this inspector?
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
                  <Text style={styles.confirmButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
            {selectedInspector && (
              <View style={styles.deleteInspectorInfo}>
                <Text style={styles.deleteInspectorName}>
                  {selectedInspector.name}
                </Text>
                {selectedInspector.inspectorId && (
                  <Text style={styles.deleteInspectorId}>
                    ID: {selectedInspector.inspectorId}
                  </Text>
                )}
                <Text style={styles.deleteInspectorPhone}>
                  {selectedInspector.mobileNumber}
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
    paddingTop: 46,
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
    paddingHorizontal: 14,
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
  addInspectorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  addInspectorButton: {
    backgroundColor: "#093F86",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  addInspectorText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  sectionTitleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F5F5F5",
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
    alignItems: "flex-start",
    marginBottom: 12,
  },
  inspectorInfo: {
    flex: 1,
    marginRight: 12,
  },
  inspectorName: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    marginBottom: 4,
  },
  inspectorDetail: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
    alignItems: "center",
  },
  statusOnDuty: {
    backgroundColor: "#6FA882",
  },
  statusOffDuty: {
    backgroundColor: "#F44336",
  },
  statusPending: {
    backgroundColor: "#FF9800",
  },
  statusText: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    color: "#FFFFFF",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#6FA882",
  },
  deleteButton: {
    backgroundColor: "#E57373",
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
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
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
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
    color: "#FFFFFF",
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
  // Delete modal styles
  deleteModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: "80%",
    padding: 24,
    alignItems: "center",
    alignSelf: "center",
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
    backgroundColor: "#E57373",
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
  deleteInspectorInfo: {
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  deleteInspectorName: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    marginBottom: 4,
  },
  deleteInspectorId: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#6FA882",
    marginBottom: 4,
  },
  deleteInspectorPhone: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
  },
  // Success modal styles
  successModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: "80%",
    padding: 32,
    alignItems: "center",
    alignSelf: "center",
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
});

export default MCInspectorManage;
