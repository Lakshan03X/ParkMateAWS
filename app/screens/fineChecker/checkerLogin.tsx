import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
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
import fineCheckerService from "../../services/fineCheckerService";

const CheckerLogin = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCouncilModal, setShowCouncilModal] = useState(false);
  const [selectedCouncil, setSelectedCouncil] = useState("");
  const [checkerData, setCheckerData] = useState<any>(null);

  const municipalCouncils = [
    "Colombo",
    "Dehiwala-Mount Lavinia",
    "Sri Jayawardenepura Kotte",
    "Moratuwa",
    "Negombo",
    "Ratmalana",
    "Kandy",
    "Galle",
    "Matara",
    "Jaffna",
    "Batticaloa",
  ];

  const handleSignIn = async () => {
    if (!email.trim()) {
      Alert.alert("Validation Error", "Please enter your email");
      return;
    }

    if (!password.trim()) {
      Alert.alert("Validation Error", "Please enter your password");
      return;
    }

    try {
      setIsLoading(true);

      const result = await fineCheckerService.verifyFineCheckerLogin(
        email.trim(),
        password.trim()
      );

      if (result.status === "error") {
        Alert.alert("Login Failed", result.message);
        setIsLoading(false);
        return;
      }

      if (result.checker) {
        setCheckerData(result.checker);
        setShowCouncilModal(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error during sign in:", error);
      Alert.alert(
        "Error",
        "An error occurred during sign in. Please try again."
      );
      setIsLoading(false);
    }
  };

  const handleCouncilSelection = (council: string) => {
    setSelectedCouncil(council);
  };

  const handleCouncilConfirm = () => {
    if (!selectedCouncil) {
      Alert.alert("Selection Required", "Please select a municipal council");
      return;
    }

    if (selectedCouncil !== checkerData.municipalCouncil) {
      Alert.alert(
        "Invalid Selection",
        `You are assigned to ${checkerData.municipalCouncil} Municipal Council. Please select the correct council.`
      );
      return;
    }

    setShowCouncilModal(false);
    router.push({
      pathname: "/screens/fineChecker/fineCheckerDashboard",
      params: {
        checkerId: checkerData.id,
        checkerName: checkerData.fullName,
        email: checkerData.email,
        municipalCouncil: checkerData.municipalCouncil,
        employeeId: checkerData.checkerId,
        mobileNumber: checkerData.mobileNumber,
        status: checkerData.status,
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <StatusBar barStyle="dark-content" />

        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 10 }]}
          onPress={() => router.replace("/loginSelection")}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: insets.top + 60 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.illustrationContainer}>
              <Image
                source={require("../../../assets/appImages/checkerLogin.png")}
                style={{ width: 280, height: 240 }}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>Fine Checker Log in</Text>
            <Text style={styles.subtitle}>
              Access Your Fine Checker Account
            </Text>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Office email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                    disabled={isLoading}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={24}
                      color="#999"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.signInButton,
                isLoading && styles.signInButtonDisabled,
              ]}
              onPress={handleSignIn}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.signInButtonText}>Sign in</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal
        visible={showCouncilModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Image
                source={require("../../../assets/appImages/checkerLogin.png")}
                style={{ width: 200, height: 150 }}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.modalTitle}>Select your Municipal Council</Text>

            <ScrollView
              style={styles.councilList}
              showsVerticalScrollIndicator={false}
            >
              {municipalCouncils.map((council) => (
                <TouchableOpacity
                  key={council}
                  style={[
                    styles.councilOption,
                    selectedCouncil === council && styles.councilOptionSelected,
                  ]}
                  onPress={() => handleCouncilSelection(council)}
                  activeOpacity={0.7}
                >
                  <View style={styles.radioButton}>
                    {selectedCouncil === council && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.councilText,
                      selectedCouncil === council && styles.councilTextSelected,
                    ]}
                  >
                    {council}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCouncilConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  illustrationContainer: {
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 20,
  },
  illustrationPlaceholder: {
    width: 280,
    height: 200,
    backgroundColor: "#E8F5E9",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    flexDirection: "row",
    gap: 40,
    paddingHorizontal: 20,
  },
  carContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  officerContainer: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  officerCap: {
    position: "absolute",
    top: -5,
    right: -5,
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    textAlign: "center",
    marginBottom: 32,
  },
  formContainer: {
    marginBottom: 32,
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D0D0",
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#000000",
  },
  eyeIcon: {
    paddingHorizontal: 12,
  },
  signInButton: {
    backgroundColor: "#093F86",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    marginTop: 20,
  },
  signInButtonDisabled: {
    backgroundColor: "#B0BEC5",
    opacity: 0.6,
  },
  signInButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    paddingVertical: 30,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 24,
  },
  councilList: {
    maxHeight: 300,
    marginBottom: 24,
  },
  councilOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: "#F5F5F5",
    borderWidth: 2,
    borderColor: "transparent",
  },
  councilOptionSelected: {
    backgroundColor: "#E3F2FD",
    borderColor: "#093F86",
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#093F86",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#093F86",
  },
  councilText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#333333",
    flex: 1,
  },
  councilTextSelected: {
    fontFamily: "Poppins-SemiBold",
    color: "#093F86",
  },
  submitButton: {
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
  submitButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
});

export default CheckerLogin;
