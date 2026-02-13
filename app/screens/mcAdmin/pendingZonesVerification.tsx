import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  RefreshControl,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import parkingZoneService, {
  ParkingZone,
} from "../../services/parkingZoneService";

const PendingZonesVerification = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingZones, setPendingZones] = useState<ParkingZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<ParkingZone | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadPendingZones();
  }, []);

  const loadPendingZones = async () => {
    try {
      setIsLoading(true);
      const zones = await parkingZoneService.getPendingZones();
      setPendingZones(zones);
      console.log(`📋 Loaded ${zones.length} pending zones`);
    } catch (error: any) {
      console.error("Error loading pending zones:", error);
      Alert.alert("Error", "Failed to load pending zones");
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPendingZones();
    setRefreshing(false);
  };

  const handleViewDetails = (zone: ParkingZone) => {
    setSelectedZone(zone);
    setShowDetailsModal(true);
  };

  const handleVerify = async (zone: ParkingZone) => {
    Alert.alert(
      "Verify Parking Zone",
      `Are you sure you want to verify and activate "${zone.zoneCode} - ${zone.location}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Verify",
          style: "default",
          onPress: async () => {
            try {
              setIsProcessing(true);
              const adminId = "ADMIN_001"; // TODO: Get from auth context
              await parkingZoneService.verifyZone(zone.id, adminId);

              Alert.alert(
                "Success",
                "Parking zone verified and activated successfully!",
              );
              await loadPendingZones();
            } catch (error: any) {
              console.error("Error verifying zone:", error);
              Alert.alert("Error", error.message || "Failed to verify zone");
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ],
    );
  };

  const handleReject = (zone: ParkingZone) => {
    setSelectedZone(zone);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert("Error", "Please provide a reason for rejection");
      return;
    }

    if (!selectedZone) return;

    try {
      setIsProcessing(true);
      const adminId = "ADMIN_001"; // TODO: Get from auth context
      await parkingZoneService.rejectZone(
        selectedZone.id,
        adminId,
        rejectionReason,
      );

      setShowRejectModal(false);
      Alert.alert("Success", "Parking zone rejected successfully!");
      await loadPendingZones();
    } catch (error: any) {
      console.error("Error rejecting zone:", error);
      Alert.alert("Error", error.message || "Failed to reject zone");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: any) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const renderZoneCard = (zone: ParkingZone) => (
    <View key={zone.id} style={styles.zoneCard}>
      <View style={styles.cardHeader}>
        <View style={styles.zoneInfo}>
          <Text style={styles.zoneCode}>{zone.zoneCode}</Text>
          <Text style={styles.location}>{zone.location}</Text>
          <Text style={styles.council}>{zone.municipalCouncil}</Text>
        </View>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingText}>PENDING</Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color="#666666" />
          <Text style={styles.detailText}>Rs. {zone.parkingRate}/hour</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#666666" />
          <Text style={styles.detailText}>{zone.activeHours}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="car-outline" size={16} color="#666666" />
          <Text style={styles.detailText}>{zone.totalParkingSpots} spots</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#666666" />
          <Text style={styles.detailText}>
            Submitted: {formatDate(zone.createdAt)}
          </Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => handleViewDetails(zone)}
          activeOpacity={0.7}
        >
          <Ionicons name="eye-outline" size={18} color="#2196F3" />
          <Text style={styles.detailsButtonText}>Details</Text>
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => handleReject(zone)}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" />
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.verifyButton}
            onPress={() => handleVerify(zone)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.verifyButtonText}>Verify</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

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
          <Text style={styles.headerTitle}>Pending Zones</Text>
          <View style={styles.headerRight}>
            {pendingZones.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{pendingZones.length}</Text>
              </View>
            )}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#4CAF50"]}
            />
          }
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
            </View>
          ) : pendingZones.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="checkmark-done-circle-outline"
                size={80}
                color="#CCCCCC"
              />
              <Text style={styles.emptyStateTitle}>All Caught Up!</Text>
              <Text style={styles.emptyStateText}>
                No pending parking zones waiting for verification
              </Text>
            </View>
          ) : (
            <View style={styles.zonesContainer}>
              <Text style={styles.sectionTitle}>
                Zones Awaiting Verification ({pendingZones.length})
              </Text>
              {pendingZones.map((zone) => renderZoneCard(zone))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Zone Details</Text>
            <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
              <Ionicons name="close" size={28} color="#000000" />
            </TouchableOpacity>
          </View>

          {selectedZone && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>
                  Basic Information
                </Text>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Zone Code:</Text>
                  <Text style={styles.detailsValue}>
                    {selectedZone.zoneCode}
                  </Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Location:</Text>
                  <Text style={styles.detailsValue}>
                    {selectedZone.location}
                  </Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Municipal Council:</Text>
                  <Text style={styles.detailsValue}>
                    {selectedZone.municipalCouncil}
                  </Text>
                </View>
              </View>

              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Parking Details</Text>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Parking Rate:</Text>
                  <Text style={styles.detailsValue}>
                    Rs. {selectedZone.parkingRate}/hour
                  </Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Active Hours:</Text>
                  <Text style={styles.detailsValue}>
                    {selectedZone.activeHours}
                  </Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Total Spots:</Text>
                  <Text style={styles.detailsValue}>
                    {selectedZone.totalParkingSpots}
                  </Text>
                </View>
                {selectedZone.parkingSections && (
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Sections:</Text>
                    <Text style={styles.detailsValue}>
                      {selectedZone.parkingSections}
                    </Text>
                  </View>
                )}
              </View>

              {selectedZone.latitude && selectedZone.longitude && (
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>
                    Location Coordinates
                  </Text>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Latitude:</Text>
                    <Text style={styles.detailsValue}>
                      {selectedZone.latitude.toFixed(6)}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Longitude:</Text>
                    <Text style={styles.detailsValue}>
                      {selectedZone.longitude.toFixed(6)}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Submission Info</Text>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Created By:</Text>
                  <Text style={styles.detailsValue}>
                    {selectedZone.createdBy || "N/A"}
                  </Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Submitted On:</Text>
                  <Text style={styles.detailsValue}>
                    {formatDate(selectedZone.createdAt)}
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.rejectModalOverlay}>
          <View style={styles.rejectModalContent}>
            <Text style={styles.rejectModalTitle}>Reject Parking Zone</Text>
            <Text style={styles.rejectModalSubtitle}>
              {selectedZone?.zoneCode} - {selectedZone?.location}
            </Text>

            <Text style={styles.rejectLabel}>Reason for Rejection *</Text>
            <TextInput
              style={styles.rejectInput}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Enter the reason for rejection..."
              placeholderTextColor="#999999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.rejectModalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowRejectModal(false)}
                disabled={isProcessing}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmRejectButton,
                  isProcessing && styles.buttonDisabled,
                ]}
                onPress={confirmReject}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmRejectButtonText}>
                    Reject Zone
                  </Text>
                )}
              </TouchableOpacity>
            </View>
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
    alignItems: "flex-end",
  },
  countBadge: {
    backgroundColor: "#FF5722",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: "center",
  },
  countText: {
    fontSize: 12,
    fontFamily: "Poppins-Bold",
    color: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontFamily: "Poppins-Bold",
    color: "#000000",
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#999999",
    textAlign: "center",
    maxWidth: 280,
  },
  zonesContainer: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    marginBottom: 8,
  },
  zoneCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  zoneInfo: {
    flex: 1,
  },
  zoneCode: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: "#000000",
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    marginBottom: 2,
  },
  council: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#999999",
  },
  pendingBadge: {
    backgroundColor: "#FF9800",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pendingText: {
    fontSize: 11,
    fontFamily: "Poppins-Bold",
    color: "#FFFFFF",
  },
  cardDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#666666",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailsButtonText: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#2196F3",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  rejectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF4444",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  rejectButtonText: {
    fontSize: 13,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  verifyButtonText: {
    fontSize: 13,
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
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsSectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  detailsLabel: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
  },
  detailsValue: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    flex: 1,
    textAlign: "right",
  },
  rejectModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  rejectModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    width: "100%",
  },
  rejectModalTitle: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: "#000000",
    marginBottom: 8,
  },
  rejectModalSubtitle: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    marginBottom: 20,
  },
  rejectLabel: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    marginBottom: 8,
  },
  rejectInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#000000",
    minHeight: 100,
    marginBottom: 20,
  },
  rejectModalActions: {
    flexDirection: "row",
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
    color: "#666666",
  },
  confirmRejectButton: {
    flex: 1,
    backgroundColor: "#FF4444",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmRejectButtonText: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  buttonDisabled: {
    backgroundColor: "#CCCCCC",
  },
});

export default PendingZonesVerification;
