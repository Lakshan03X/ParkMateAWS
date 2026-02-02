import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import awsDemoService from "../services/awsDemoService";
import { DemoUserData } from "../services/awsDemoService";

const AdminNICSetup = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [existingNICs, setExistingNICs] = useState<DemoUserData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form state for adding new NIC
  const [nicNumber, setNicNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");

  useEffect(() => {
    loadExistingNICs();
  }, []);

  const loadExistingNICs = async () => {
    setIsLoading(true);
    try {
      const nics = await awsDemoService.getAllDemoUsers();
      setExistingNICs(nics);
    } catch (error) {
      console.error("Error loading NICs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitializeDemoData = async () => {
    Alert.alert(
      "Initialize Demo Data",
      "This will add 5 demo NIC records to AWS DynamoDB. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Initialize",
          onPress: async () => {
            setIsInitializing(true);
            try {
              await awsDemoService.initializeDemoData();
              Alert.alert("Success", "Demo data initialized successfully!");
              await loadExistingNICs();
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.message || "Failed to initialize demo data"
              );
            } finally {
              setIsInitializing(false);
            }
          },
        },
      ]
    );
  };

  const handleAddNewNIC = async () => {
    // Validation
    if (!nicNumber || nicNumber.length !== 12) {
      Alert.alert(
        "Validation Error",
        "Please enter a valid 12-digit NIC number"
      );
      return;
    }
    if (!fullName || !address) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    setIsInitializing(true);
    try {
      const newUser: DemoUserData = {
        nicNumber,
        fullName,
        address,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
      };

      const result = await awsDemoService.addDemoUser(newUser);

      if (result.status === "success") {
        Alert.alert("Success", "NIC added successfully!");
        // Clear form
        setNicNumber("");
        setFullName("");
        setAddress("");
        setDateOfBirth("");
        setGender("");
        await loadExistingNICs();
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add NIC");
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Ionicons name="shield-checkmark" size={48} color="#093F86" />
            <Text style={styles.title}>NIC Database Setup</Text>
            <Text style={styles.subtitle}>
              Add NIC records to AWS DynamoDB for verification
            </Text>
          </View>

          {/* Initialize Demo Data Button */}
          <TouchableOpacity
            style={styles.initButton}
            onPress={handleInitializeDemoData}
            disabled={isInitializing}
            activeOpacity={0.8}
          >
            {isInitializing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
                <Text style={styles.initButtonText}>
                  Initialize 5 Demo NICs in AWS DynamoDB
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Add New NIC Form */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Add New NIC Record</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>NIC Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 12-digit NIC"
                value={nicNumber}
                onChangeText={setNicNumber}
                keyboardType="numeric"
                maxLength={12}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address *</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Enter address"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Male/Female"
                value={gender}
                onChangeText={setGender}
              />
            </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddNewNIC}
              disabled={isInitializing}
              activeOpacity={0.8}
            >
              {isInitializing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.addButtonText}>Add NIC to AWS DynamoDB</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Existing NICs List */}
          <View style={styles.listSection}>
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>Existing NICs in AWS DynamoDB</Text>
              <TouchableOpacity onPress={loadExistingNICs} disabled={isLoading}>
                <Ionicons
                  name="refresh"
                  size={24}
                  color="#093F86"
                  style={{ opacity: isLoading ? 0.5 : 1 }}
                />
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <ActivityIndicator
                size="large"
                color="#093F86"
                style={{ marginTop: 20 }}
              />
            ) : existingNICs.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="folder-open-outline" size={48} color="#999" />
                <Text style={styles.emptyText}>No NICs found in AWS DynamoDB</Text>
                <Text style={styles.emptySubtext}>
                  Initialize demo data or add new NICs above
                </Text>
              </View>
            ) : (
              existingNICs.map((nic, index) => (
                <View key={index} style={styles.nicCard}>
                  <View style={styles.nicCardHeader}>
                    <Ionicons name="person-circle" size={24} color="#093F86" />
                    <Text style={styles.nicNumber}>{nic.nicNumber}</Text>
                  </View>
                  <Text style={styles.nicName}>{nic.fullName}</Text>
                  <Text style={styles.nicAddress}>{nic.address}</Text>
                  {nic.dateOfBirth && (
                    <Text style={styles.nicDetail}>DOB: {nic.dateOfBirth}</Text>
                  )}
                  {nic.gender && (
                    <Text style={styles.nicDetail}>Gender: {nic.gender}</Text>
                  )}
                </View>
              ))
            )}
          </View>

          {/* Instructions */}
          <View style={styles.instructionsBox}>
            <Ionicons name="information-circle" size={20} color="#093F86" />
            <View style={{ flex: 1 }}>
              <Text style={styles.instructionsTitle}>How to use:</Text>
              <Text style={styles.instructionsText}>
                1. Click "Initialize 5 Demo NICs" to add sample data{"\n"}
                2. Or manually add NICs using the form above{"\n"}
                3. NICs will be stored in AWS DynamoDB 'demoUsers' collection{"\n"}
                4. Users can verify their NIC during registration
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: "#000",
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
    textAlign: "center",
  },
  initButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 10,
    marginBottom: 30,
    gap: 10,
  },
  initButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  formSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9F9F9",
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#000",
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  addButton: {
    backgroundColor: "#093F86",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  listSection: {
    marginBottom: 20,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#666",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },
  nicCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#093F86",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  nicCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  nicNumber: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    color: "#093F86",
  },
  nicName: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    marginBottom: 4,
  },
  nicAddress: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginBottom: 4,
  },
  nicDetail: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#999",
  },
  instructionsBox: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    padding: 16,
    borderRadius: 10,
    gap: 12,
  },
  instructionsTitle: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#093F86",
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#093F86",
    lineHeight: 18,
  },
});

export default AdminNICSetup;
