import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import firebaseDemoService from "../../services/firebaseDemoService";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../services/firebase";

const Profile = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [nicNumber, setNicNumber] = useState("");
  const [address, setAddress] = useState("");
  const [registrationType, setRegistrationType] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    if (params.userId) {
      try {
        const userDoc = await getDoc(doc(db, "users", params.userId as string));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFullName(userData.fullName || "");
          setMobileNumber(userData.mobileNumber || "");
          setEmail(userData.email || "");
          setNicNumber(userData.nicNumber || "");
          setAddress(userData.address || "");
          setRegistrationType(userData.registrationType || "");
          setProfileImage(userData.profileImage || userData.photoURL || null);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    } else {
      // Load from params
      setFullName((params.fullName as string) || "");
      setMobileNumber((params.mobileNumber as string) || "");
      setEmail((params.email as string) || "");
      setNicNumber((params.nicNumber as string) || "");
    }
  };

  const requestPermissions = async () => {
    try {
      const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (lib.status !== "granted") {
        Alert.alert(
          "Permission required",
          "Permission to access media library is required to update profile picture."
        );
        return false;
      }
      const cam = await ImagePicker.requestCameraPermissionsAsync();
      if (cam.status !== "granted") {
        // camera not granted is ok if user only wants gallery
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  const uploadImageAsync = async (uri: string) => {
    if (!params.userId) throw new Error("User ID not found");
    setIsUploadingImage(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      // determine content type from uri
      let contentType = "image/jpeg";
      if (uri.endsWith(".png")) contentType = "image/png";

      const storageRef = ref(
        storage,
        `profileImages/${params.userId}_${Date.now()}`
      );
      await uploadBytes(storageRef, blob, { contentType });
      const downloadUrl = await getDownloadURL(storageRef);
      // update user document immediately with photo URL
      const userRef = doc(db, "users", params.userId as string);
      await updateDoc(userRef, {
        profileImage: downloadUrl,
        updatedAt: Timestamp.now(),
      });
      setProfileImage(downloadUrl);
      return downloadUrl;
    } catch (err: any) {
      console.error("Upload error:", err);
      // include firebase storage bucket in hint
      try {
        const Constants = await import("expo-constants");
        const extra = (Constants as any).expoConfig?.extra || {};
        const bucket = extra.FIREBASE_STORAGE_BUCKET || "(not set)";
        Alert.alert(
          "Upload failed",
          `Failed to upload image.\nCode: ${err.code || "unknown"}\nMessage: ${
            err.message || String(err)
          }\nStorage bucket: ${bucket}`
        );
      } catch (e) {
        Alert.alert(
          "Upload failed",
          `${err.code || "unknown"}: ${err.message || String(err)}`
        );
      }
      throw err;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const pickImageFromLibrary = async () => {
    const ok = await requestPermissions();
    if (!ok) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (
      !result.canceled &&
      result.assets &&
      result.assets.length > 0 &&
      result.assets[0].uri
    ) {
      await uploadImageAsync(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const ok = await requestPermissions();
    if (!ok) return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (
      !result.canceled &&
      result.assets &&
      result.assets.length > 0 &&
      result.assets[0].uri
    ) {
      await uploadImageAsync(result.assets[0].uri);
    }
  };

  const handlePickImage = () => {
    Alert.alert("Update Profile Photo", "Choose an option", [
      { text: "Camera", onPress: takePhoto },
      { text: "Gallery", onPress: pickImageFromLibrary },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleVerifyNIC = async () => {
    if (nicNumber.length !== 12) {
      Alert.alert("Validation Error", "NIC must be 12 digits");
      return;
    }

    setIsVerifying(true);
    try {
      const result = await firebaseDemoService.verifyNIC(nicNumber);

      if (result.status === "success" && result.data) {
        setAddress(result.data.address);
        Alert.alert("Success", "NIC verified successfully!");
      } else {
        Alert.alert(
          "Verification Failed",
          "Unable to verify NIC. Please check the number."
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to verify NIC");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!params.userId) {
      Alert.alert("Error", "User ID not found");
      return;
    }

    // Validate NIC if provided
    if (nicNumber && nicNumber.length !== 12) {
      Alert.alert("Validation Error", "NIC must be 12 digits");
      return;
    }

    setIsLoading(true);
    try {
      const userRef = doc(db, "users", params.userId as string);
      const updateData: any = {
        fullName,
        mobileNumber,
        email,
        updatedAt: Timestamp.now(),
      };

      // Add NIC and address if provided
      if (nicNumber && nicNumber.length === 12) {
        updateData.nicNumber = nicNumber;
        updateData.address = address;
        updateData.profileComplete = true; // Mark profile as complete
      }

      // include profile image URL if available
      if (profileImage) {
        updateData.profileImage = profileImage;
      }

      await updateDoc(userRef, updateData);

      Alert.alert("Success", "Profile updated successfully!", [
        {
          text: "OK",
          onPress: () => {
            setIsEditing(false);
            // Navigate back to dashboard with updated data
            router.replace({
              pathname: "/screens/parkingOwner/ownerDashboard",
              params: {
                userId: params.userId,
                fullName,
                mobileNumber,
                email,
                nicNumber,
                profileComplete: nicNumber ? "true" : "false",
              },
            });
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
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
          {/* Profile Icon */}
          <View style={styles.profileIconContainer}>
            <View style={styles.profileCircle}>
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.avatarImage}
                />
              ) : (
                <Ionicons name="person" size={60} color="#093F86" />
              )}

              {isEditing && (
                <TouchableOpacity
                  style={styles.cameraOverlay}
                  onPress={handlePickImage}
                  activeOpacity={0.8}
                >
                  {isUploadingImage ? (
                    <ActivityIndicator size="small" color="#093F86" />
                  ) : (
                    <Ionicons name="camera" size={20} color="#093F86" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>My Profile</Text>

          {/* Edit Button */}
          {!isEditing && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={20} color="#093F86" />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={fullName}
                onChangeText={setFullName}
                editable={isEditing}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
              />
            </View>

            {/* Mobile Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={mobileNumber}
                editable={false}
                placeholder="Mobile number"
                placeholderTextColor="#999"
              />
              <Text style={styles.helperText}>
                Mobile number cannot be changed
              </Text>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={email}
                onChangeText={setEmail}
                editable={isEditing}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Enter your email"
                placeholderTextColor="#999"
              />
            </View>

            {/* NIC Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                NIC Number{" "}
                {!nicNumber && (
                  <Text style={styles.optionalText}>
                    (add to complete profile)
                  </Text>
                )}
              </Text>
              <View style={styles.nicInputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.nicInput,
                    !isEditing && styles.inputDisabled,
                    nicNumber && styles.inputVerified,
                  ]}
                  value={nicNumber}
                  onChangeText={setNicNumber}
                  editable={isEditing && registrationType === "mobile"}
                  keyboardType="numeric"
                  maxLength={12}
                  placeholder="Enter 12-digit NIC"
                  placeholderTextColor="#999"
                />
                {isEditing &&
                  registrationType === "mobile" &&
                  nicNumber.length === 12 && (
                    <TouchableOpacity
                      style={styles.verifyButton}
                      onPress={handleVerifyNIC}
                      disabled={isVerifying}
                    >
                      {isVerifying ? (
                        <ActivityIndicator size="small" color="#093F86" />
                      ) : (
                        <Text style={styles.verifyButtonText}>Verify</Text>
                      )}
                    </TouchableOpacity>
                  )}
              </View>
              {registrationType !== "mobile" && (
                <Text style={styles.helperText}>
                  NIC number cannot be changed (registered with NIC)
                </Text>
              )}
            </View>

            {/* Address */}
            {address ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={[styles.input, styles.inputDisabled, styles.textArea]}
                  value={address}
                  editable={false}
                  multiline
                  numberOfLines={3}
                  placeholder="Address"
                  placeholderTextColor="#999"
                />
                <Text style={styles.helperText}>
                  Auto-filled from NIC verification
                </Text>
              </View>
            ) : null}

            {/* Warning for incomplete profile */}
            {!nicNumber && (
              <View style={styles.warningBox}>
                <Ionicons name="information-circle" size={20} color="#FF9800" />
                <Text style={styles.warningText}>
                  Add your NIC to complete your profile and access all features
                </Text>
              </View>
            )}
          </View>

          {/* Save Button */}
          {isEditing && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isLoading && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setIsEditing(false);
                  loadUserData();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
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
  topSafeArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
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
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  profileIconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  profileCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  cameraOverlay: {
    position: "absolute",
    right: -6,
    bottom: -6,
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 24,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    gap: 8,
    alignSelf: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonText: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#093F86",
  },
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 20,
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
  optionalText: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#FF9800",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#000000",
  },
  inputDisabled: {
    backgroundColor: "#F5F5F5",
    color: "#666666",
  },
  inputVerified: {
    borderColor: "#4CAF50",
    borderWidth: 2,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  helperText: {
    fontSize: 11,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    marginTop: 4,
  },
  nicInputContainer: {
    position: "relative",
  },
  nicInput: {
    paddingRight: 80,
  },
  verifyButton: {
    position: "absolute",
    right: 8,
    top: 8,
    backgroundColor: "#E3F2FD",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  verifyButtonText: {
    fontSize: 12,
    fontFamily: "Poppins-SemiBold",
    color: "#093F86",
  },
  warningBox: {
    flexDirection: "row",
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 8,
    gap: 10,
    alignItems: "center",
    marginTop: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#E65100",
    lineHeight: 18,
  },
  buttonContainer: {
    gap: 12,
  },
  saveButton: {
    backgroundColor: "#093F86",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
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
  cancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D0D0D0",
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#666666",
  },
});

export default Profile;
