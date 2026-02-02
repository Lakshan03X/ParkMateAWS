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
import awsDynamoService from "../../services/awsDynamoService";

interface ParkingRevenue {
  id: string;
  boralesgamuwa: string;
  zoneCode: string;
  location: string;
  zoneType: string;
  parkingRatePerHour: string;
  createdAt?: any;
  updatedAt?: any;
}

const ParkingRevenue = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState("");
  const [revenues, setRevenues] = useState<ParkingRevenue[]>([]);
  const [filteredRevenues, setFilteredRevenues] = useState<ParkingRevenue[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedRevenue, setSelectedRevenue] = useState<ParkingRevenue | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    boralesgamuwa: "",
    zoneCode: "",
    location: "",
    zoneType: "",
    parkingRatePerHour: "",
  });

  const COLLECTION_NAME = "parkingRevenue";

  // Load parking revenues from AWS DynamoDB
  useEffect(() => {
    loadParkingRevenues();
  }, []);

  const loadParkingRevenues = async () => {
    try {
      setIsLoading(true);
      const result = await awsDynamoService.scan(COLLECTION_NAME);

      const revenuesData: ParkingRevenue[] = (result.items || []).map((item: any) => ({
        id: item.id || item.revenueId, // Fallback if id is stored differently
        boralesgamuwa: item.boralesgamuwa,
        zoneCode: item.zoneCode,
        location: item.location,
        zoneType: item.zoneType,
        parkingRatePerHour: item.parkingRatePerHour,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));

      // Sort by createdAt desc (client-side since we scanned)
      revenuesData.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      setRevenues(revenuesData);
      setFilteredRevenues(revenuesData);
    } catch (error: any) {
      console.error("Error loading parking revenues:", error);
      Alert.alert("Error", error.message || "Failed to load parking revenues");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter revenues based on search query
  useEffect(() => {
    let filtered = revenues;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (revenue) =>
          revenue.boralesgamuwa
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          revenue.zoneCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          revenue.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredRevenues(filtered);
  }, [searchQuery, revenues]);

  const resetForm = () => {
    setFormData({
      boralesgamuwa: "",
      zoneCode: "",
      location: "",
      zoneType: "",
      parkingRatePerHour: "",
    });
  };

  const handleAddNewRevenue = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleSaveNewRevenue = async () => {
    if (
      !formData.boralesgamuwa.trim() ||
      !formData.zoneCode.trim() ||
      !formData.location.trim() ||
      !formData.zoneType.trim() ||
      !formData.parkingRatePerHour.trim()
    ) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    try {
      setIsSaving(true);

      // Generate ID
      const revenueId = `REV_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const newRevenue = {
        id: revenueId,
        boralesgamuwa: formData.boralesgamuwa,
        zoneCode: formData.zoneCode,
        location: formData.location,
        zoneType: formData.zoneType,
        parkingRatePerHour: formData.parkingRatePerHour,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await awsDynamoService.putItem(COLLECTION_NAME, newRevenue);

      await loadParkingRevenues();

      setShowAddModal(false);
      setSuccessMessage("Successfully added a new parking revenue");
      setShowSuccessModal(true);
      resetForm();
    } catch (error: any) {
      console.error("Error adding parking revenue:", error);
      Alert.alert("Error", error.message || "Failed to add parking revenue");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditRevenue = (revenue: ParkingRevenue) => {
    setSelectedRevenue(revenue);
    setFormData({
      boralesgamuwa: revenue.boralesgamuwa,
      zoneCode: revenue.zoneCode,
      location: revenue.location,
      zoneType: revenue.zoneType,
      parkingRatePerHour: revenue.parkingRatePerHour,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (
      !formData.boralesgamuwa.trim() ||
      !formData.zoneCode.trim() ||
      !formData.location.trim() ||
      !formData.zoneType.trim() ||
      !formData.parkingRatePerHour.trim()
    ) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    if (!selectedRevenue) return;

    try {
      setIsSaving(true);

      await awsDynamoService.updateItem(
        COLLECTION_NAME,
        { id: selectedRevenue.id },
        {
          boralesgamuwa: formData.boralesgamuwa,
          zoneCode: formData.zoneCode,
          location: formData.location,
          zoneType: formData.zoneType,
          parkingRatePerHour: formData.parkingRatePerHour,
          updatedAt: new Date().toISOString(),
        }
      );

      await loadParkingRevenues();

      setShowEditModal(false);
      setSuccessMessage("Successfully updated the parking revenue details");
      setShowSuccessModal(true);
      resetForm();
      setSelectedRevenue(null);
    } catch (error: any) {
      console.error("Error updating parking revenue:", error);
      Alert.alert("Error", error.message || "Failed to update parking revenue");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRevenue = (revenue: ParkingRevenue) => {
    setSelectedRevenue(revenue);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedRevenue) return;

    try {
      setIsSaving(true);

      await awsDynamoService.deleteItem(COLLECTION_NAME, { id: selectedRevenue.id });

      await loadParkingRevenues();

      setShowDeleteModal(false);
      setSuccessMessage("Successfully deleted the parking revenue");
      setShowSuccessModal(true);
      setSelectedRevenue(null);
    } catch (error: any) {
      console.error("Error deleting parking revenue:", error);
      Alert.alert("Error", error.message || "Failed to delete parking revenue");
    } finally {
      setIsSaving(false);
    }
  };

  const renderRevenueCard = ({ item }: { item: ParkingRevenue }) => (
    <View style={styles.revenueCard}>
      <View style={styles.revenueHeader}>
        <View style={styles.revenueInfo}>
          <Text style={styles.revenueMunicipal}>
            {item.boralesgamuwa} Municipal Council
          </Text>
          <Text style={styles.revenueZone}>
            Zone {item.zoneCode} - {item.location}
          </Text>
          <Text style={styles.revenueRate}>Rs. {item.parkingRatePerHour}</Text>
          <View style={styles.zoneTypeBadge}>
            <Text style={styles.zoneTypeText}>{item.zoneType}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditRevenue(item)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteRevenue(item)}
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
          <Text style={styles.headerTitle}>Parking Revenue</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadParkingRevenues}
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
              placeholder="Search Zones"
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

        {/* Add New Revenue Button */}
        <View style={styles.addRevenueContainer}>
          <TouchableOpacity
            style={styles.addRevenueButton}
            onPress={handleAddNewRevenue}
            activeOpacity={0.8}
          >
            <Text style={styles.addRevenueText}>Add New Revenue</Text>
          </TouchableOpacity>
        </View>

        {/* Revenues List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6FA882" />
            <Text style={styles.loadingText}>Loading parking revenues...</Text>
          </View>
        ) : filteredRevenues.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cash-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No parking revenues found</Text>
            {searchQuery.length > 0 && (
              <Text style={styles.emptySubtext}>Try adjusting your search</Text>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredRevenues}
            renderItem={renderRevenueCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>

      {/* Add New Revenue Modal */}
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
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add Revenue</Text>
              <View style={styles.modalSpacer} />
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Boralesgamuwa</Text>
                <View style={styles.dropdownContainer}>
                  <Picker
                    selectedValue={formData.boralesgamuwa}
                    onValueChange={(value) =>
                      setFormData({ ...formData, boralesgamuwa: value })
                    }
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Council" value="" />
                    <Picker.Item label="Boralesgamuwa" value="Boralesgamuwa" />
                    <Picker.Item label="Colombo" value="Colombo" />
                    <Picker.Item label="Kandy" value="Kandy" />
                    <Picker.Item label="Galle" value="Galle" />
                    <Picker.Item label="Negombo" value="Negombo" />
                    <Picker.Item label="Dehiwala" value="Dehiwala" />
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Zone Code</Text>
                <View style={styles.dropdownContainer}>
                  <Picker
                    selectedValue={formData.zoneCode}
                    onValueChange={(value) =>
                      setFormData({ ...formData, zoneCode: value })
                    }
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Zone" value="" />
                    <Picker.Item label="A" value="A" />
                    <Picker.Item label="B" value="B" />
                    <Picker.Item label="C" value="C" />
                    <Picker.Item label="D" value="D" />
                    <Picker.Item label="E" value="E" />
                    <Picker.Item label="F" value="F" />
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Main Road"
                  placeholderTextColor="#999"
                  value={formData.location}
                  onChangeText={(text) =>
                    setFormData({ ...formData, location: text })
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Zone Type</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Street Parking"
                  placeholderTextColor="#999"
                  value={formData.zoneType}
                  onChangeText={(text) =>
                    setFormData({ ...formData, zoneType: text })
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Parking Rate(Per Hour)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Rs.100.00"
                  placeholderTextColor="#999"
                  value={formData.parkingRatePerHour}
                  onChangeText={(text) =>
                    setFormData({ ...formData, parkingRatePerHour: text })
                  }
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSaveNewRevenue}
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

      {/* Edit Revenue Modal */}
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
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Revenue</Text>
              <View style={styles.modalSpacer} />
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Boralesgamuwa</Text>
                <View style={styles.dropdownContainer}>
                  <Picker
                    selectedValue={formData.boralesgamuwa}
                    onValueChange={(value) =>
                      setFormData({ ...formData, boralesgamuwa: value })
                    }
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Council" value="" />
                    <Picker.Item label="Boralesgamuwa" value="Boralesgamuwa" />
                    <Picker.Item label="Colombo" value="Colombo" />
                    <Picker.Item label="Kandy" value="Kandy" />
                    <Picker.Item label="Galle" value="Galle" />
                    <Picker.Item label="Negombo" value="Negombo" />
                    <Picker.Item label="Dehiwala" value="Dehiwala" />
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Zone Code</Text>
                <View style={styles.dropdownContainer}>
                  <Picker
                    selectedValue={formData.zoneCode}
                    onValueChange={(value) =>
                      setFormData({ ...formData, zoneCode: value })
                    }
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Zone" value="" />
                    <Picker.Item label="A" value="A" />
                    <Picker.Item label="B" value="B" />
                    <Picker.Item label="C" value="C" />
                    <Picker.Item label="D" value="D" />
                    <Picker.Item label="E" value="E" />
                    <Picker.Item label="F" value="F" />
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Main Road"
                  placeholderTextColor="#999"
                  value={formData.location}
                  onChangeText={(text) =>
                    setFormData({ ...formData, location: text })
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Zone Type</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Street Parking"
                  placeholderTextColor="#999"
                  value={formData.zoneType}
                  onChangeText={(text) =>
                    setFormData({ ...formData, zoneType: text })
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Parking Rate(Per Hour)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Rs.100.00"
                  placeholderTextColor="#999"
                  value={formData.parkingRatePerHour}
                  onChangeText={(text) =>
                    setFormData({ ...formData, parkingRatePerHour: text })
                  }
                  keyboardType="numeric"
                />
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
              Are you sure you want to Delete this revenue entry?
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
            {selectedRevenue && (
              <View style={styles.deleteRevenueInfo}>
                <Text style={styles.deleteRevenueName}>
                  {selectedRevenue.boralesgamuwa} Municipal Council
                </Text>
                <Text style={styles.deleteRevenueCode}>
                  Zone {selectedRevenue.zoneCode} - {selectedRevenue.location}
                </Text>
                <Text style={styles.deleteRevenueRate}>
                  Rs. {selectedRevenue.parkingRatePerHour}
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
  addRevenueContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  addRevenueButton: {
    backgroundColor: "#093F86",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  addRevenueText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  revenueCard: {
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
  revenueHeader: {
    marginBottom: 12,
  },
  revenueInfo: {
    flex: 1,
  },
  revenueMunicipal: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    marginBottom: 6,
  },
  revenueZone: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#666",
    marginBottom: 6,
  },
  revenueRate: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    color: "#6FA882",
    marginBottom: 8,
  },
  zoneTypeBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  zoneTypeText: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    color: "#1976D2",
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
  deleteRevenueInfo: {
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  deleteRevenueName: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    marginBottom: 4,
  },
  deleteRevenueCode: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#666",
    marginBottom: 4,
  },
  deleteRevenueRate: {
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

export default ParkingRevenue;
