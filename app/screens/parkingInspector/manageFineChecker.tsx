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
import fineCheckerService, {
  FineChecker,
} from "../../services/fineCheckerService";

// Municipal Councils List
const MUNICIPAL_COUNCILS = [
  "Colombo",
  "Dehiwala-Mount Lavinia",
  "Sri Jayawardenepura Kotte",
  "Moratuwa",
  "Ratmalana",
  "Gampaha",
  "Negombo",
];

const ManageFineChecker = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "onDuty" | "offDuty"
  >("all");
  const [fineCheckers, setFineCheckers] = useState<FineChecker[]>([]);
  const [filteredCheckers, setFilteredCheckers] = useState<FineChecker[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCouncilPicker, setShowCouncilPicker] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedChecker, setSelectedChecker] = useState<FineChecker | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    municipalCouncil: "",
    checkerId: "",
  });

  // Load fine checkers from AWS DynamoDB
  useEffect(() => {
    loadFineCheckers();
  }, []);

  const loadFineCheckers = async () => {
    try {
      setIsLoading(true);
      const checkersData = await fineCheckerService.getAllFineCheckers();
      setFineCheckers(checkersData);
      setFilteredCheckers(checkersData);
    } catch (error: any) {
      console.error("Error loading fine checkers:", error);
      Alert.alert("Error", error.message || "Failed to load fine checkers");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter fine checkers based on search query and selected filter
  useEffect(() => {
    let filtered = fineCheckers;

    // Apply status filter
    if (selectedFilter !== "all") {
      filtered = filtered.filter(
        (checker) => checker.status === selectedFilter,
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (checker) =>
          checker.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          checker.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          checker.municipalCouncil
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (checker.checkerId &&
            checker.checkerId
              .toLowerCase()
              .includes(searchQuery.toLowerCase())),
      );
    }

    setFilteredCheckers(filtered);
  }, [searchQuery, selectedFilter, fineCheckers]);

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      password: "",
      municipalCouncil: "",
      checkerId: "",
    });
  };

  const handleAddNewChecker = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleSaveNewChecker = async () => {
    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.password.trim() ||
      !formData.municipalCouncil.trim()
    ) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert("Validation Error", "Please enter a valid email address");
      return;
    }

    try {
      setIsSaving(true);

      const newChecker = await fineCheckerService.addFineChecker({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        municipalCouncil: formData.municipalCouncil,
        checkerId: formData.checkerId,
        status: "offDuty",
      });

      // Refresh the list
      await loadFineCheckers();

      setShowAddModal(false);
      setSuccessMessage("Successfully added a new fine checker");
      setShowSuccessModal(true);
      resetForm();
    } catch (error: any) {
      console.error("Error adding fine checker:", error);
      Alert.alert("Error", error.message || "Failed to add fine checker");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditChecker = (checker: FineChecker) => {
    setSelectedChecker(checker);
    setFormData({
      fullName: checker.fullName,
      email: checker.email,
      password: checker.password || "",
      municipalCouncil: checker.municipalCouncil,
      checkerId: checker.checkerId || "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.municipalCouncil.trim()
    ) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    if (!selectedChecker) return;

    try {
      setIsSaving(true);

      const updates: Partial<FineChecker> = {
        fullName: formData.fullName,
        email: formData.email,
        municipalCouncil: formData.municipalCouncil,
        checkerId: formData.checkerId,
      };

      // Only update password if it's been changed
      if (formData.password.trim()) {
        updates.password = formData.password;
      }

      await fineCheckerService.updateFineChecker(selectedChecker.id, updates);

      // Refresh the list
      await loadFineCheckers();

      setShowEditModal(false);
      setSuccessMessage("Successfully updated the fine checker details");
      setShowSuccessModal(true);
      resetForm();
      setSelectedChecker(null);
    } catch (error: any) {
      console.error("Error updating fine checker:", error);
      Alert.alert("Error", error.message || "Failed to update fine checker");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteChecker = (checker: FineChecker) => {
    setSelectedChecker(checker);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedChecker) return;

    try {
      setIsSaving(true);

      await fineCheckerService.deleteFineChecker(selectedChecker.id);

      // Refresh the list
      await loadFineCheckers();

      setShowDeleteModal(false);
      setSuccessMessage("Successfully deleted the fine checker");
      setShowSuccessModal(true);
      setSelectedChecker(null);
    } catch (error: any) {
      console.error("Error deleting fine checker:", error);
      Alert.alert("Error", error.message || "Failed to delete fine checker");
    } finally {
      setIsSaving(false);
    }
  };

  const selectMunicipalCouncil = (council: string) => {
    setFormData({ ...formData, municipalCouncil: council });
    setShowCouncilPicker(false);
  };

  const renderCheckerCard = ({ item }: { item: FineChecker }) => (
    <View style={styles.checkerCard}>
      <View style={styles.checkerHeader}>
        <View style={styles.checkerInfo}>
          <Text style={styles.checkerName}>{item.fullName}</Text>
          {item.checkerId && (
            <Text style={styles.checkerId}>ID: {item.checkerId}</Text>
          )}
          <Text style={styles.checkerEmail}>{item.email}</Text>
          <Text style={styles.checkerCouncil}>📍 {item.municipalCouncil}</Text>
        </View>
      </View>

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditChecker(item)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteChecker(item)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusBadge,
            item.status === "onDuty"
              ? styles.statusOnDuty
              : styles.statusOffDuty,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              item.status === "onDuty" ? styles.dotOnDuty : styles.dotOffDuty,
            ]}
          />
          <Text
            style={[
              styles.statusText,
              item.status === "onDuty" ? styles.textOnDuty : styles.textOffDuty,
            ]}
          >
            {item.status === "onDuty" ? "On Duty" : "Off Duty"}
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
        <StatusBar barStyle="dark-content" backgroundColor="#4A7C5B" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fine Checker Management</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadFineCheckers}
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
              placeholder="Search Fine Checkers"
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

        {/* Add New Fine Checker Button */}
        <View style={styles.addUserContainer}>
          <TouchableOpacity
            style={styles.addUserButton}
            onPress={handleAddNewChecker}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.addUserText}>Add new Fine Checker</Text>
          </TouchableOpacity>
        </View>

        {/* Section Title */}
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>
            Fine Checkers list ({filteredCheckers.length})
          </Text>
        </View>

        {/* Fine Checkers List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A7C5B" />
            <Text style={styles.loadingText}>Loading fine checkers...</Text>
          </View>
        ) : filteredCheckers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No fine checkers found</Text>
            {searchQuery.length > 0 && (
              <Text style={styles.emptySubtext}>Try adjusting your search</Text>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredCheckers}
            renderItem={renderCheckerCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>

      {/* Add New Fine Checker Modal */}
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
                <Text style={styles.modalTitle}>Add Fine Checker</Text>
                <View style={styles.modalSpacer} />
              </View>

              <ScrollView style={styles.modalForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name *</Text>
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
                  <Text style={styles.label}>Email *</Text>
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

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password"
                    placeholderTextColor="#999"
                    value={formData.password}
                    onChangeText={(text) =>
                      setFormData({ ...formData, password: text })
                    }
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Municipal Council *</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowCouncilPicker(true)}
                  >
                    <Text
                      style={[
                        styles.pickerButtonText,
                        !formData.municipalCouncil && styles.pickerPlaceholder,
                      ]}
                    >
                      {formData.municipalCouncil || "Select Municipal Council"}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Checker ID (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter checker ID"
                    placeholderTextColor="#999"
                    value={formData.checkerId}
                    onChangeText={(text) =>
                      setFormData({ ...formData, checkerId: text })
                    }
                  />
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isSaving && styles.saveButtonDisabled,
                ]}
                onPress={handleSaveNewChecker}
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

      {/* Edit Fine Checker Modal */}
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
                <Text style={styles.modalTitle}>Edit Fine Checker</Text>
                <View style={styles.modalSpacer} />
              </View>

              <ScrollView style={styles.modalForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name *</Text>
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
                  <Text style={styles.label}>Email *</Text>
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

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Password (Leave empty to keep current)
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter new password"
                    placeholderTextColor="#999"
                    value={formData.password}
                    onChangeText={(text) =>
                      setFormData({ ...formData, password: text })
                    }
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Municipal Council *</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowCouncilPicker(true)}
                  >
                    <Text
                      style={[
                        styles.pickerButtonText,
                        !formData.municipalCouncil && styles.pickerPlaceholder,
                      ]}
                    >
                      {formData.municipalCouncil || "Select Municipal Council"}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Checker ID (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter checker ID"
                    placeholderTextColor="#999"
                    value={formData.checkerId}
                    onChangeText={(text) =>
                      setFormData({ ...formData, checkerId: text })
                    }
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

      {/* Municipal Council Picker Modal */}
      <Modal
        visible={showCouncilPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCouncilPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Municipal Council</Text>
              <TouchableOpacity onPress={() => setShowCouncilPicker(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {MUNICIPAL_COUNCILS.map((council) => (
                <TouchableOpacity
                  key={council}
                  style={[
                    styles.pickerItem,
                    formData.municipalCouncil === council &&
                      styles.pickerItemSelected,
                  ]}
                  onPress={() => selectMunicipalCouncil(council)}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      formData.municipalCouncil === council &&
                        styles.pickerItemTextSelected,
                    ]}
                  >
                    {council}
                  </Text>
                  {formData.municipalCouncil === council && (
                    <Ionicons name="checkmark" size={24} color="#4A7C5B" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
              Are you sure you want to Delete this fine checker?
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
            {selectedChecker && (
              <View style={styles.deleteCheckerInfo}>
                <Text style={styles.deleteCheckerName}>
                  {selectedChecker.fullName}
                </Text>
                {selectedChecker.checkerId && (
                  <Text style={styles.deleteCheckerId}>
                    ID: {selectedChecker.checkerId}
                  </Text>
                )}
                <Text style={styles.deleteCheckerEmail}>
                  {selectedChecker.email}
                </Text>
                <Text style={styles.deleteCheckerCouncil}>
                  📍 {selectedChecker.municipalCouncil}
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
    paddingVertical: 50,
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
    borderRadius: 30,
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
  checkerCard: {
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
  checkerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  checkerInfo: {
    flex: 1,
  },
  checkerName: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    marginBottom: 4,
  },
  checkerId: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    color: "#4A7C5B",
    marginBottom: 4,
  },
  checkerEmail: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginBottom: 4,
  },
  checkerCouncil: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    color: "#093F86",
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
  statusOnDuty: {
    backgroundColor: "#6FA882",
  },
  statusOffDuty: {
    backgroundColor: "#E0E0E0",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOnDuty: {
    backgroundColor: "#FFFFFF",
  },
  dotOffDuty: {
    backgroundColor: "#666",
  },
  statusText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
  },
  textOnDuty: {
    color: "#FFFFFF",
  },
  textOffDuty: {
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
  pickerButton: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerButtonText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#000",
  },
  pickerPlaceholder: {
    color: "#999",
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
  // Municipal Council Picker Modal
  pickerModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: "85%",
    maxHeight: "70%",
    overflow: "hidden",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  pickerTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
  },
  pickerList: {
    maxHeight: 400,
  },
  pickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  pickerItemSelected: {
    backgroundColor: "#F0F8F4",
  },
  pickerItemText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#333",
  },
  pickerItemTextSelected: {
    fontFamily: "Poppins-SemiBold",
    color: "#4A7C5B",
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
  deleteCheckerInfo: {
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  deleteCheckerName: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    marginBottom: 4,
  },
  deleteCheckerId: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#4A7C5B",
    marginBottom: 4,
  },
  deleteCheckerEmail: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginBottom: 4,
  },
  deleteCheckerCouncil: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    color: "#093F86",
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

export default ManageFineChecker;
