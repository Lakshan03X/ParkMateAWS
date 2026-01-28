import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import inspectorService from "../../services/inspectorService";

const InspectorProfile = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  // Municipal councils list
  const municipalCouncils = [
    "Colombo",
    "Dehiwala-Mount Lavinia",
    "Sri Jayawardenepura Kotte",
    "Moratuwa",
    "Negombo",
    "Kandy",
    "Galle",
    "Matara",
    "Jaffna",
    "Batticaloa",
  ];

  // State for form fields
  const [name, setName] = useState(params.inspectorName as string);
  const [email, setEmail] = useState((params.email as string) || "");
  const [municipalCouncil, setMunicipalCouncil] = useState(
    (params.municipalCouncil as string) || "Colombo"
  );
  const [inspectorId, setInspectorId] = useState(params.employeeId as string);
  const [mobileNumber, setMobileNumber] = useState(
    params.mobileNumber as string
  );
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCouncilPicker, setShowCouncilPicker] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    loadInspectorData();
  }, []);

  const loadInspectorData = async () => {
    try {
      setIsLoading(true);
      const inspector = await inspectorService.getInspectorById(
        params.inspectorId as string
      );

      if (inspector) {
        setName(inspector.name);
        setEmail(inspector.email || "");
        setInspectorId(inspector.inspectorId || "");
        setMobileNumber(inspector.mobileNumber);
        setProfilePictureUrl(inspector.profilePictureUrl || null);
        // If municipal council data is available in inspector object, set it
      }
    } catch (error) {
      console.error("Error loading inspector data:", error);
      Alert.alert("Error", "Failed to load inspector details");
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your photo library"
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploadingImage(true);
        const imageUri = result.assets[0].uri;
        
        // In a production app, you would upload this to Firebase Storage
        // For now, we'll just use the local URI
        setProfilePictureUrl(imageUri);
        
        // Update immediately in Firebase
        await inspectorService.updateInspector(params.inspectorId as string, {
          profilePictureUrl: imageUri,
        });
        
        setIsUploadingImage(false);
        Alert.alert("Success", "Profile picture updated successfully");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      setIsUploadingImage(false);
      Alert.alert("Error", "Failed to update profile picture");
    }
  };

  const handleSaveDetails = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please enter your name");
      return;
    }

    if (email && !isValidEmail(email)) {
      Alert.alert("Validation Error", "Please enter a valid email address");
      return;
    }

    try {
      setIsSaving(true);

      // Update inspector details in Firebase
      await inspectorService.updateInspector(params.inspectorId as string, {
        name: name.trim(),
        email: email.trim(),
      });

      Alert.alert("Success", "Profile updated successfully", [
        {
          text: "OK",
          onPress: () => {
            setIsEditing(false);
          },
        },
      ]);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleCancel = () => {
    // Restore original values
    setName(params.inspectorName as string);
    setEmail((params.email as string) || "");
    setMunicipalCouncil((params.municipalCouncil as string) || "Colombo");
    setIsEditing(false);
  };

  const handleCouncilSelect = (council: string) => {
    setMunicipalCouncil(council);
    setShowCouncilPicker(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#093F86" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Safe Area Background */}
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <StatusBar barStyle="light-content" />

        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 10 }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 60 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Image */}
          <View style={styles.profileImageContainer}>
            <TouchableOpacity onPress={pickImage} disabled={!isEditing}>
              {profilePictureUrl ? (
                <Image
                  source={{ uri: profilePictureUrl }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profileCircle}>
                  <Ionicons name="person" size={60} color="#093F86" />
                </View>
              )}
              {isUploadingImage && (
                <ActivityIndicator
                  size="small"
                  color="#093F86"
                  style={styles.imageLoader}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text style={styles.title}>Inspector Profile</Text>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={[
                  styles.input,
                  !isEditing && styles.inputDisabled,
                  isEditing && styles.inputEditable,
                ]}
                placeholder="Enter your name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
                editable={isEditing}
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  !isEditing && styles.inputDisabled,
                  isEditing && styles.inputEditable,
                ]}
                placeholder="nimal@gmail.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={isEditing}
              />
            </View>

            {/* Phone Number Input (Non-editable) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.lockedInputContainer}>
                <TextInput
                  style={[styles.input, styles.inputLocked]}
                  placeholder="071 156 5678"
                  placeholderTextColor="#999"
                  value={mobileNumber}
                  editable={false}
                />
                <View style={styles.lockIcon}>
                  <Ionicons name="lock-closed" size={16} color="#666" />
                </View>
              </View>
              <Text style={styles.hintText}>
                Phone number cannot be changed
              </Text>
            </View>

            {/* Inspector ID Input (Non-editable) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Inspector Id</Text>
              <View style={styles.lockedInputContainer}>
                <TextInput
                  style={[styles.input, styles.inputLocked]}
                  placeholder="Ins10779"
                  placeholderTextColor="#999"
                  value={inspectorId}
                  editable={false}
                />
                <View style={styles.lockIcon}>
                  <Ionicons name="lock-closed" size={16} color="#666" />
                </View>
              </View>
              <Text style={styles.hintText}>
                Inspector ID cannot be changed
              </Text>
            </View>

            {/* Municipal Council Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Municipal Council</Text>
              <TouchableOpacity
                style={[
                  styles.dropdownButton,
                  !isEditing && styles.inputDisabled,
                  isEditing && styles.inputEditable,
                ]}
                onPress={() =>
                  isEditing && setShowCouncilPicker(!showCouncilPicker)
                }
                disabled={!isEditing}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    !isEditing && styles.disabledText,
                  ]}
                >
                  {municipalCouncil}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>

              {/* Council Options */}
              {showCouncilPicker && isEditing && (
                <View style={styles.optionsContainer}>
                  <ScrollView style={styles.optionsList} nestedScrollEnabled>
                    {municipalCouncils.map((council) => (
                      <TouchableOpacity
                        key={council}
                        style={[
                          styles.optionItem,
                          municipalCouncil === council &&
                            styles.optionItemSelected,
                        ]}
                        onPress={() => handleCouncilSelect(council)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            municipalCouncil === council &&
                              styles.optionTextSelected,
                          ]}
                        >
                          {council}
                        </Text>
                        {municipalCouncil === council && (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color="#093F86"
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          {!isEditing ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color="#FFFFFF"
                style={styles.buttonIcon}
              />
              <Text style={styles.editButtonText}>Edit Details</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancel}
                activeOpacity={0.8}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.saveButton,
                  isSaving && styles.saveButtonDisabled,
                ]}
                onPress={handleSaveDetails}
                activeOpacity={0.8}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20}
                      color="#FFFFFF"
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.saveButtonText}>Save Details</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
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
  backButton: {
    position: "absolute",
    left: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  profileCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imageLoader: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -10 }, { translateY: -10 }],
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 32,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginTop: 16,
  },
  formContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#333333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#000000",
  },
  inputDisabled: {
    backgroundColor: "#F5F5F5",
    color: "#666666",
  },
  inputEditable: {
    backgroundColor: "#FFFFFF",
    borderColor: "#093F86",
    borderWidth: 2,
  },
  inputLocked: {
    backgroundColor: "#F5F5F5",
    color: "#666666",
    paddingRight: 48,
  },
  lockedInputContainer: {
    position: "relative",
  },
  lockIcon: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  hintText: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#999999",
    marginTop: 4,
    fontStyle: "italic",
  },
  dropdownButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#000000",
  },
  disabledText: {
    color: "#666666",
  },
  optionsContainer: {
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D0D0D0",
    maxHeight: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionsList: {
    maxHeight: 200,
  },
  optionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  optionItemSelected: {
    backgroundColor: "#E3F2FD",
  },
  optionText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#000000",
  },
  optionTextSelected: {
    fontFamily: "Poppins-Medium",
    color: "#093F86",
  },
  editButton: {
    backgroundColor: "#093F86",
    borderRadius: 10,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  editButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  cancelButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#093F86",
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#093F86",
  },
  saveButton: {
    backgroundColor: "#093F86",
  },
  saveButtonDisabled: {
    backgroundColor: "#B0BEC5",
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  buttonIcon: {
    marginRight: 8,
  },
});

export default InspectorProfile;
