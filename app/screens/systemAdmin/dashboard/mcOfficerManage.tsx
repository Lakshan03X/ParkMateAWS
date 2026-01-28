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
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import mcOfficerService, {
  MCOfficer,
} from "../../../services/mcOfficerService";
import inspectorService, {
  Inspector,
} from "../../../services/inspectorService";

const MCOfficerManage = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "on duty" | "off duty"
  >("all");
  const [officers, setOfficers] = useState<MCOfficer[]>([]);
  const [filteredOfficers, setFilteredOfficers] = useState<MCOfficer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inspectors, setInspectors] = useState<Inspector[]>([]);

  // Modal states
  const [showAddOfficerModal, setShowAddOfficerModal] = useState(false);
  const [showAssignInspectorModal, setShowAssignInspectorModal] =
    useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedOfficer, setSelectedOfficer] = useState<MCOfficer | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);

  // Form states for Add Officer
  const [officerFormData, setOfficerFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    municipalCouncilId: "",
    password: "",
  });

  // Form states for Assign Inspector
  const [assignFormData, setAssignFormData] = useState({
    zone: "",
    inspectorId: "",
    startDate: new Date(),
    endDate: new Date(),
    startHour: "09",
    startMinute: "00",
    startPeriod: "AM",
    endHour: "05",
    endMinute: "00",
    endPeriod: "PM",
    municipalCouncil: "",
  });

  // Time picker states
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Available zones (A-E)
  const zones = ["A", "B", "C", "D", "E"];

  // Time options
  const hours = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0")
  );
  const periods = ["AM", "PM"];

  // Municipal councils
  const municipalCouncils = [
    "Colombo",
    "Dehiwala-Mount Lavinia",
    "Moratuwa",
    "Sri Jayawardenepura Kotte",
    "Maharagama",
    "Kolonnawa",
    "Kaduwela",
    "Kesbewa",
  ];

  // Load officers and inspectors from Firebase
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [officersData, inspectorsData] = await Promise.all([
        mcOfficerService.getAllOfficers(),
        inspectorService.getAllInspectors(),
      ]);
      setOfficers(officersData);
      setFilteredOfficers(officersData);
      setInspectors(inspectorsData);
    } catch (error: any) {
      console.error("Error loading data:", error);
      Alert.alert("Error", error.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = officers;

    // Apply status filter
    if (selectedFilter !== "all") {
      filtered = filtered.filter(
        (officer) => officer.status === selectedFilter
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (officer) =>
          officer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          officer.mobileNumber.includes(searchQuery) ||
          officer.zone.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredOfficers(filtered);
  }, [searchQuery, selectedFilter, officers]);

  const resetOfficerForm = () => {
    setOfficerFormData({
      fullName: "",
      phoneNumber: "",
      email: "",
      municipalCouncilId: "",
      password: "",
    });
  };

  const resetAssignForm = () => {
    setAssignFormData({
      zone: "",
      inspectorId: "",
      startDate: new Date(),
      endDate: new Date(),
      startHour: "09",
      startMinute: "00",
      startPeriod: "AM",
      endHour: "05",
      endMinute: "00",
      endPeriod: "PM",
      municipalCouncil: "",
    });
  };

  const handleAddOfficer = () => {
    resetOfficerForm();
    setShowAddOfficerModal(true);
  };

  const handleAssignInspector = () => {
    resetAssignForm();
    setShowAssignInspectorModal(true);
  };

  const handleSaveOfficer = async () => {
    if (
      !officerFormData.fullName.trim() ||
      !officerFormData.phoneNumber.trim() ||
      !officerFormData.municipalCouncilId.trim() ||
      !officerFormData.email.trim() ||
      !officerFormData.password.trim()
    ) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    try {
      setIsSaving(true);

      await mcOfficerService.addOfficer({
        name: officerFormData.fullName,
        mobileNumber: officerFormData.phoneNumber,
        email: officerFormData.email,
        zone: officerFormData.municipalCouncilId,
        status: "on duty",
        password: officerFormData.password,
        councilId: officerFormData.municipalCouncilId,
      });

      await loadData();
      setShowAddOfficerModal(false);
      setSuccessMessage("Successfully added a new Municipal Council Officer");
      setShowSuccessModal(true);
      resetOfficerForm();
    } catch (error: any) {
      console.error("Error adding officer:", error);
      Alert.alert("Error", error.message || "Failed to add officer");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAssignment = async () => {
    if (
      !assignFormData.zone ||
      !assignFormData.inspectorId ||
      !assignFormData.municipalCouncil
    ) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    try {
      setIsSaving(true);

      const selectedInspector = inspectors.find(
        (i) => i.id === assignFormData.inspectorId
      );

      if (selectedInspector) {
        await inspectorService.updateInspector(assignFormData.inspectorId, {
          assignedZone: assignFormData.zone,
          municipalCouncil: assignFormData.municipalCouncil,
          isAssigned: true,
        });
      }

      await loadData();
      setShowAssignInspectorModal(false);
      setSuccessMessage("Successfully assigned parking inspector");
      setShowSuccessModal(true);
      resetAssignForm();
    } catch (error: any) {
      console.error("Error assigning inspector:", error);
      Alert.alert("Error", error.message || "Failed to assign inspector");
    } finally {
      setIsSaving(false);
    }
  };

  const getFormattedTime = (hour: string, minute: string, period: string) => {
    return `${hour}:${minute} ${period}`;
  };

  const formatDate = (date: Date) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${
      months[date.getMonth()]
    } ${date.getDate()}, ${date.getFullYear()}`;
  };

  const getCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty slots for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const [calendarDate, setCalendarDate] = useState(new Date());

  const changeMonth = (direction: number) => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCalendarDate(newDate);
  };

  const selectStartDate = (date: Date) => {
    setAssignFormData({ ...assignFormData, startDate: date });
    if (date > assignFormData.endDate) {
      setAssignFormData({ ...assignFormData, startDate: date, endDate: date });
    }
  };

  const selectEndDate = (date: Date) => {
    if (date >= assignFormData.startDate) {
      setAssignFormData({ ...assignFormData, endDate: date });
    } else {
      Alert.alert("Invalid Date", "End date must be after start date");
    }
  };

  const handleEditOfficer = (officer: MCOfficer) => {
    // Navigate to edit page with officer data
    router.push({
      pathname: "/screens/systemAdmin/dashboard/sysAdminEditMCOfficer",
      params: {
        id: officer.id,
        name: officer.name,
        mobileNumber: officer.mobileNumber,
        email: officer.email || "",
        zone: officer.zone,
      },
    });
  };

  const handleDeleteOfficer = (officer: MCOfficer) => {
    setSelectedOfficer(officer);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedOfficer) return;

    try {
      setIsSaving(true);
      await mcOfficerService.deleteOfficer(selectedOfficer.id);
      await loadData();
      setShowDeleteModal(false);
      setSuccessMessage("Successfully deleted Municipal Council Officer");
      setShowSuccessModal(true);
      setSelectedOfficer(null);
    } catch (error: any) {
      console.error("Error deleting officer:", error);
      Alert.alert("Error", error.message || "Failed to delete officer");
    } finally {
      setIsSaving(false);
    }
  };

  const renderOfficerCard = ({ item }: { item: MCOfficer }) => (
    <View style={styles.officerCard}>
      <View style={styles.officerHeader}>
        <View style={styles.officerInfo}>
          <Text style={styles.officerName}>{item.name}</Text>
          <Text style={styles.officerZone}>{item.zone}</Text>
          <Text style={styles.officerMobile}>{item.mobileNumber}</Text>
          {item.email && <Text style={styles.officerEmail}>{item.email}</Text>}
        </View>
      </View>

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditOfficer(item)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteOfficer(item)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusBadge,
            item.status === "on duty"
              ? styles.statusOnDuty
              : styles.statusOffDuty,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              item.status === "on duty"
                ? styles.textOnDuty
                : styles.textOffDuty,
            ]}
          >
            {item.status === "on duty" ? "On duty" : "Off duty"}
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
          <Text style={styles.headerTitle}>
            Municipal Council{"\n"}Officer Management
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadData}
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
              placeholder="Search Officers"
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
              styles.filterTab,
              selectedFilter === "all" && styles.filterTabActive,
            ]}
            onPress={() => setSelectedFilter("all")}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedFilter === "all" && styles.filterTabTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              selectedFilter === "on duty" && styles.filterTabActive,
            ]}
            onPress={() => setSelectedFilter("on duty")}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedFilter === "on duty" && styles.filterTabTextActive,
              ]}
            >
              Online
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              selectedFilter === "off duty" && styles.filterTabActive,
            ]}
            onPress={() => setSelectedFilter("off duty")}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedFilter === "off duty" && styles.filterTabTextActive,
              ]}
            >
              Offline
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[styles.actionButtonMain, styles.addOfficerBtn]}
            onPress={handleAddOfficer}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonMainText}>Add Officers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButtonMain, styles.assignInspectorBtn]}
            onPress={handleAssignInspector}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonMainText}>Assign Officers</Text>
          </TouchableOpacity>
        </View>

        {/* Section Title */}
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>
            Municipal Council Officers list
          </Text>
        </View>

        {/* Officers List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A7C5B" />
            <Text style={styles.loadingText}>Loading officers...</Text>
          </View>
        ) : filteredOfficers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No officers found</Text>
            {searchQuery.length > 0 && (
              <Text style={styles.emptySubtext}>Try adjusting your search</Text>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredOfficers}
            renderItem={renderOfficerCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>

      {/* Add Officer Modal */}
      <Modal
        visible={showAddOfficerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddOfficerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalBackButton}
                onPress={() => setShowAddOfficerModal(false)}
              >
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                Add Municipal{"\n"}Council Officers
              </Text>
              <View style={styles.modalSpacer} />
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  placeholderTextColor="#999"
                  value={officerFormData.fullName}
                  onChangeText={(text) =>
                    setOfficerFormData({ ...officerFormData, fullName: text })
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter phone number"
                  placeholderTextColor="#999"
                  value={officerFormData.phoneNumber}
                  onChangeText={(text) =>
                    setOfficerFormData({
                      ...officerFormData,
                      phoneNumber: text,
                    })
                  }
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email"
                  placeholderTextColor="#999"
                  value={officerFormData.email}
                  onChangeText={(text) =>
                    setOfficerFormData({ ...officerFormData, email: text })
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Municipal Council Id</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter municipal council ID"
                  placeholderTextColor="#999"
                  value={officerFormData.municipalCouncilId}
                  onChangeText={(text) =>
                    setOfficerFormData({
                      ...officerFormData,
                      municipalCouncilId: text,
                    })
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  placeholderTextColor="#999"
                  value={officerFormData.password}
                  onChangeText={(text) =>
                    setOfficerFormData({
                      ...officerFormData,
                      password: text,
                    })
                  }
                  secureTextEntry
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSaveOfficer}
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

      {/* Assign Inspector Modal */}
      <Modal
        visible={showAssignInspectorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAssignInspectorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalBackButton}
                onPress={() => setShowAssignInspectorModal(false)}
              >
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Assign Parking Inspector</Text>
              <View style={styles.modalSpacer} />
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Select the zone code</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={assignFormData.zone}
                    onValueChange={(value) =>
                      setAssignFormData({ ...assignFormData, zone: value })
                    }
                    style={styles.picker}
                  >
                    <Picker.Item label="Select zone (A-E)" value="" />
                    {zones.map((zone) => (
                      <Picker.Item
                        key={zone}
                        label={`Zone ${zone}`}
                        value={zone}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Select Parking Inspector</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={assignFormData.inspectorId}
                    onValueChange={(value) =>
                      setAssignFormData({
                        ...assignFormData,
                        inspectorId: value,
                      })
                    }
                    style={styles.picker}
                  >
                    <Picker.Item label="Select inspector" value="" />
                    {inspectors.map((inspector) => (
                      <Picker.Item
                        key={inspector.id}
                        label={`${inspector.name} - ${inspector.mobileNumber}`}
                        value={inspector.id}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Schedule Start Date</Text>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => setShowStartDatePicker(!showStartDatePicker)}
                >
                  <Text style={styles.timePickerButtonText}>
                    {formatDate(assignFormData.startDate)}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                </TouchableOpacity>
                {showStartDatePicker && (
                  <View style={styles.calendarContainer}>
                    <View style={styles.calendarHeader}>
                      <TouchableOpacity onPress={() => changeMonth(-1)}>
                        <Ionicons
                          name="chevron-back"
                          size={24}
                          color="#4A7C5B"
                        />
                      </TouchableOpacity>
                      <Text style={styles.calendarMonth}>
                        {calendarDate.toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </Text>
                      <TouchableOpacity onPress={() => changeMonth(1)}>
                        <Ionicons
                          name="chevron-forward"
                          size={24}
                          color="#4A7C5B"
                        />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.calendarDaysHeader}>
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (day) => (
                          <Text key={day} style={styles.calendarDayName}>
                            {day}
                          </Text>
                        )
                      )}
                    </View>
                    <View style={styles.calendarDaysContainer}>
                      {getCalendarDays(calendarDate).map((day, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.calendarDay,
                            !day && styles.calendarDayEmpty,
                            day &&
                              day.toDateString() ===
                                assignFormData.startDate.toDateString() &&
                              styles.calendarDaySelected,
                          ]}
                          onPress={() => {
                            if (day) {
                              selectStartDate(day);
                              setShowStartDatePicker(false);
                            }
                          }}
                          disabled={!day}
                        >
                          {day && (
                            <Text
                              style={[
                                styles.calendarDayText,
                                day.toDateString() ===
                                  assignFormData.startDate.toDateString() &&
                                  styles.calendarDayTextSelected,
                              ]}
                            >
                              {day.getDate()}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Schedule End Date</Text>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => setShowEndDatePicker(!showEndDatePicker)}
                >
                  <Text style={styles.timePickerButtonText}>
                    {formatDate(assignFormData.endDate)}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                </TouchableOpacity>
                {showEndDatePicker && (
                  <View style={styles.calendarContainer}>
                    <View style={styles.calendarHeader}>
                      <TouchableOpacity onPress={() => changeMonth(-1)}>
                        <Ionicons
                          name="chevron-back"
                          size={24}
                          color="#4A7C5B"
                        />
                      </TouchableOpacity>
                      <Text style={styles.calendarMonth}>
                        {calendarDate.toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </Text>
                      <TouchableOpacity onPress={() => changeMonth(1)}>
                        <Ionicons
                          name="chevron-forward"
                          size={24}
                          color="#4A7C5B"
                        />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.calendarDaysHeader}>
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (day) => (
                          <Text key={day} style={styles.calendarDayName}>
                            {day}
                          </Text>
                        )
                      )}
                    </View>
                    <View style={styles.calendarDaysContainer}>
                      {getCalendarDays(calendarDate).map((day, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.calendarDay,
                            !day && styles.calendarDayEmpty,
                            day &&
                              day.toDateString() ===
                                assignFormData.endDate.toDateString() &&
                              styles.calendarDaySelected,
                          ]}
                          onPress={() => {
                            if (day) {
                              selectEndDate(day);
                              setShowEndDatePicker(false);
                            }
                          }}
                          disabled={!day}
                        >
                          {day && (
                            <Text
                              style={[
                                styles.calendarDayText,
                                day.toDateString() ===
                                  assignFormData.endDate.toDateString() &&
                                  styles.calendarDayTextSelected,
                              ]}
                            >
                              {day.getDate()}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Schedule Time(Start Time)</Text>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => setShowStartTimePicker(!showStartTimePicker)}
                >
                  <Text style={styles.timePickerButtonText}>
                    {getFormattedTime(
                      assignFormData.startHour,
                      assignFormData.startMinute,
                      assignFormData.startPeriod
                    )}
                  </Text>
                  <Ionicons name="time-outline" size={20} color="#666" />
                </TouchableOpacity>
                {showStartTimePicker && (
                  <View style={styles.timePickerContainer}>
                    <View style={styles.timePickerRow}>
                      <View style={styles.timePickerColumn}>
                        <Text style={styles.timePickerLabel}>Hour</Text>
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={assignFormData.startHour}
                            onValueChange={(value) =>
                              setAssignFormData({
                                ...assignFormData,
                                startHour: value,
                              })
                            }
                            style={styles.timePicker}
                          >
                            {hours.map((hour) => (
                              <Picker.Item
                                key={hour}
                                label={hour}
                                value={hour}
                              />
                            ))}
                          </Picker>
                        </View>
                      </View>
                      <View style={styles.timePickerColumn}>
                        <Text style={styles.timePickerLabel}>Minute</Text>
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={assignFormData.startMinute}
                            onValueChange={(value) =>
                              setAssignFormData({
                                ...assignFormData,
                                startMinute: value,
                              })
                            }
                            style={styles.timePicker}
                          >
                            {minutes.map((minute) => (
                              <Picker.Item
                                key={minute}
                                label={minute}
                                value={minute}
                              />
                            ))}
                          </Picker>
                        </View>
                      </View>
                      <View style={styles.timePickerColumn}>
                        <Text style={styles.timePickerLabel}>Period</Text>
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={assignFormData.startPeriod}
                            onValueChange={(value) =>
                              setAssignFormData({
                                ...assignFormData,
                                startPeriod: value,
                              })
                            }
                            style={styles.timePicker}
                          >
                            {periods.map((period) => (
                              <Picker.Item
                                key={period}
                                label={period}
                                value={period}
                              />
                            ))}
                          </Picker>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Schedule Time(End Time)</Text>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => setShowEndTimePicker(!showEndTimePicker)}
                >
                  <Text style={styles.timePickerButtonText}>
                    {getFormattedTime(
                      assignFormData.endHour,
                      assignFormData.endMinute,
                      assignFormData.endPeriod
                    )}
                  </Text>
                  <Ionicons name="time-outline" size={20} color="#666" />
                </TouchableOpacity>
                {showEndTimePicker && (
                  <View style={styles.timePickerContainer}>
                    <View style={styles.timePickerRow}>
                      <View style={styles.timePickerColumn}>
                        <Text style={styles.timePickerLabel}>Hour</Text>
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={assignFormData.endHour}
                            onValueChange={(value) =>
                              setAssignFormData({
                                ...assignFormData,
                                endHour: value,
                              })
                            }
                            style={styles.timePicker}
                          >
                            {hours.map((hour) => (
                              <Picker.Item
                                key={hour}
                                label={hour}
                                value={hour}
                              />
                            ))}
                          </Picker>
                        </View>
                      </View>
                      <View style={styles.timePickerColumn}>
                        <Text style={styles.timePickerLabel}>Minute</Text>
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={assignFormData.endMinute}
                            onValueChange={(value) =>
                              setAssignFormData({
                                ...assignFormData,
                                endMinute: value,
                              })
                            }
                            style={styles.timePicker}
                          >
                            {minutes.map((minute) => (
                              <Picker.Item
                                key={minute}
                                label={minute}
                                value={minute}
                              />
                            ))}
                          </Picker>
                        </View>
                      </View>
                      <View style={styles.timePickerColumn}>
                        <Text style={styles.timePickerLabel}>Period</Text>
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={assignFormData.endPeriod}
                            onValueChange={(value) =>
                              setAssignFormData({
                                ...assignFormData,
                                endPeriod: value,
                              })
                            }
                            style={styles.timePicker}
                          >
                            {periods.map((period) => (
                              <Picker.Item
                                key={period}
                                label={period}
                                value={period}
                              />
                            ))}
                          </Picker>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Registered Municipal Council</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={assignFormData.municipalCouncil}
                    onValueChange={(value) =>
                      setAssignFormData({
                        ...assignFormData,
                        municipalCouncil: value,
                      })
                    }
                    style={styles.picker}
                  >
                    <Picker.Item label="Select municipal council" value="" />
                    {municipalCouncils.map((council) => (
                      <Picker.Item
                        key={council}
                        label={council}
                        value={council}
                      />
                    ))}
                  </Picker>
                </View>
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
                <Text style={styles.saveButtonText}>Assign</Text>
              )}
            </TouchableOpacity>
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
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
    lineHeight: 24,
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
    gap: 12,
    paddingVertical: 2,
    paddingLeft: 16,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
  },
  filterTabActive: {
    backgroundColor: "#4A7C5B",
  },
  filterTabText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#666",
  },
  filterTabTextActive: {
    color: "#FFFFFF",
  },
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  actionButtonMain: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 8,
  },
  addOfficerBtn: {
    backgroundColor: "#6FA882",
  },
  assignInspectorBtn: {
    backgroundColor: "#093F86",
  },
  actionButtonMainText: {
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
  officerCard: {
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
  officerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  officerInfo: {
    flex: 1,
  },
  officerName: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    marginBottom: 4,
  },
  officerZone: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#666",
    marginBottom: 2,
  },
  officerMobile: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
  },
  officerEmail: {
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
  statusOnDuty: {
    backgroundColor: "#6FA882",
  },
  statusOffDuty: {
    backgroundColor: "#E57373",
  },
  statusText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
  },
  textOnDuty: {
    color: "#FFFFFF",
  },
  textOffDuty: {
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
    lineHeight: 24,
  },
  modalSpacer: {
    width: 32,
  },
  modalForm: {
    padding: 20,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    color: "#666",
    marginBottom: 6,
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
  pickerContainer: {
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
  timePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  timePickerButtonText: {
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
  timePickerContainer: {
    marginTop: 10,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 10,
  },
  timePickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timePickerColumn: {
    flex: 1,
    alignItems: "center",
  },
  timePickerLabel: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    color: "#666",
    marginBottom: 6,
  },
  timePicker: {
    width: "100%",
  },
  calendarContainer: {
    marginTop: 10,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 10,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  calendarMonth: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#4A7C5B",
  },
  calendarDaysHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  calendarDayName: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    color: "#666",
  },
  calendarDaysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  calendarDayEmpty: {
    backgroundColor: "transparent",
  },
  calendarDaySelected: {
    backgroundColor: "#4A7C5B",
    borderRadius: 50,
  },
  calendarDayText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#000",
  },
  calendarDayTextSelected: {
    color: "#FFFFFF",
  },
});

export default MCOfficerManage;
