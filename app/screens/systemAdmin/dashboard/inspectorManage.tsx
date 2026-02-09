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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import inspectorService, {
  Inspector,
} from "../../../services/inspectorService";

const InspectorManage = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "online" | "offline"
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
    null,
  );
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    mobileNumber: "",
    email: "",
    inspectorId: "",
  });

  // Load inspectors from AWS DynamoDB
  useEffect(() => {
    loadInspectors();
  }, []);

  const loadInspectors = async () => {
    try {
      setIsLoading(true);
      const inspectorsData = await inspectorService.getAllInspectors();
      setInspectors(inspectorsData);
      setFilteredInspectors(inspectorsData);
    } catch (error: any) {
      console.error("Error loading inspectors:", error);
      Alert.alert("Error", error.message || "Failed to load inspectors");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter inspectors based on search query and selected filter
  useEffect(() => {
    let filtered = inspectors;

    // Apply status filter
    if (selectedFilter !== "all") {
      filtered = filtered.filter(
        (inspector) => inspector.status === selectedFilter,
      );
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
              .includes(searchQuery.toLowerCase())),
      );
    }

    setFilteredInspectors(filtered);
  }, [searchQuery, selectedFilter, inspectors]);

  const resetForm = () => {
    setFormData({
      name: "",
      mobileNumber: "",
      email: "",
      inspectorId: "",
    });
  };

  const handleAddNewUser = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleSaveNewUser = async () => {
    if (!formData.name.trim() || !formData.mobileNumber.trim()) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    try {
      setIsSaving(true);

      const newInspector = await inspectorService.addInspector({
        name: formData.name,
        mobileNumber: formData.mobileNumber,
        email: formData.email,
        inspectorId: formData.inspectorId,
        status: "online",
      });

      // Refresh the list
      await loadInspectors();

      setShowAddModal(false);
      setSuccessMessage("Successfully added a new inspector");
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
      name: inspector.name,
      mobileNumber: inspector.mobileNumber,
      email: inspector.email || "",
      inspectorId: inspector.inspectorId || "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!formData.name.trim() || !formData.mobileNumber.trim()) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    if (!selectedInspector) return;

    try {
      setIsSaving(true);

      await inspectorService.updateInspector(selectedInspector.id, {
        name: formData.name,
        mobileNumber: formData.mobileNumber,
        email: formData.email,
        inspectorId: formData.inspectorId,
      });

      // Refresh the list
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

      // Refresh the list
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

  const renderInspectorCard = ({ item }: { item: Inspector }) => (
    <View style={styles.inspectorCard}>
      <View style={styles.inspectorHeader}>
        <View style={styles.inspectorInfo}>
          <Text style={styles.inspectorName}>{item.name}</Text>
          {item.inspectorId && (
            <Text style={styles.inspectorId}>ID: {item.inspectorId}</Text>
          )}
          <Text style={styles.inspectorMobile}>{item.mobileNumber}</Text>
          {item.email && (
            <Text style={styles.inspectorEmail}>{item.email}</Text>
          )}
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

      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusBadge,
            item.status === "online"
              ? styles.statusOnline
              : styles.statusOffline,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              item.status === "online" ? styles.dotOnline : styles.dotOffline,
            ]}
          />
          <Text
            style={[
              styles.statusText,
              item.status === "online" ? styles.textOnline : styles.textOffline,
            ]}
          >
            {item.status === "online" ? "Online" : "Offline"}
          </Text>
        </View>
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
          <Text style={styles.headerTitle}>Inspector Management</Text>
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
              placeholder="Search Inspectors"
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
              selectedFilter === "offline" && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter("offline")}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === "offline" && styles.filterTextActive,
              ]}
            >
              Offline
            </Text>
          </TouchableOpacity>
        </View>

        {/* Add New Inspector Button */}
        <View style={styles.addUserContainer}>
          <TouchableOpacity
            style={styles.addUserButton}
            onPress={handleAddNewUser}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.addUserText}>Add new Inspector</Text>
          </TouchableOpacity>
        </View>

        {/* Section Title */}
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>
            Inspectors list ({filteredInspectors.length})
          </Text>
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
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.modalBackButton}
                  onPress={() => setShowAddModal(false)}
                >
                  <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Add Inspector</Text>
                <View style={styles.modalSpacer} />
              </View>

              <ScrollView style={styles.modalForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter full name"
                    placeholderTextColor="#999"
                    value={formData.name}
                    onChangeText={(text) =>
                      setFormData({ ...formData, name: text })
                    }
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Inspector ID</Text>
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
                  <Text style={styles.label}>Phone number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter phone number"
                    placeholderTextColor="#999"
                    value={formData.mobileNumber}
                    onChangeText={(text) =>
                      setFormData({ ...formData, mobileNumber: text })
                    }
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter email address"
                    placeholderTextColor="#999"
                    value={formData.email}
                    onChangeText={(text) =>
                      setFormData({ ...formData, email: text })
                    }
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isSaving && styles.saveButtonDisabled,
                ]}
                onPress={handleSaveNewUser}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Details</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Edit Inspector Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.modalBackButton}
                  onPress={() => setShowEditModal(false)}
                >
                  <Ionicons name="arrow-back" size={24} color="#000" />
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
                    value={formData.name}
                    onChangeText={(text) =>
                      setFormData({ ...formData, name: text })
                    }
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Inspector ID</Text>
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
                  <Text style={styles.label}>Phone number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter phone number"
                    placeholderTextColor="#999"
                    value={formData.mobileNumber}
                    onChangeText={(text) =>
                      setFormData({ ...formData, mobileNumber: text })
                    }
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter email address"
                    placeholderTextColor="#999"
                    value={formData.email}
                    onChangeText={(text) =>
                      setFormData({ ...formData, email: text })
                    }
                    keyboardType="email-address"
                    autoCapitalize="none"
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
          </KeyboardAvoidingView>
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
              Are you sure you want to Delete this inspector
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
              <Ionicons name="checkmark-circle" size={80} color="#4A7C5B" />
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
    paddingTop: 52,
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
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 20,
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
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#FFFFFF",
  },
  filterTextActive: {
    color: "#4A7C5B",
  },
  addUserContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  addUserButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#093F86",
    borderRadius: 10,
    paddingVertical: 14,
    gap: 8,
  },
  addUserText: {
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
  inspectorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
  inspectorId: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    color: "#4A7C5B",
    marginBottom: 4,
  },
  inspectorMobile: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
  },
  inspectorEmail: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#999",
    marginTop: 2,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
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
  statusContainer: {
    alignItems: "flex-start",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusOnline: {
    backgroundColor: "#6FA882",
  },
  statusOffline: {
    backgroundColor: "#E0E0E0",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOnline: {
    backgroundColor: "#FFFFFF",
  },
  dotOffline: {
    backgroundColor: "#666",
  },
  statusText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
  },
  textOnline: {
    color: "#FFFFFF",
  },
  textOffline: {
    color: "#666",
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
    width: "85%",
    maxHeight: "80%",
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
    maxHeight: 400,
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
    color: "#4A7C5B",
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
    backgroundColor: "#4A7C5B",
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

export default InspectorManage;
