import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const VehicleOwnerSignIn = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleDigitalNICSignIn = () => {
    console.log("Sign In with Digital NIC selected");
    router.replace("/screens/parkingOwner/loginNIC");
  };

  const handleMobileNumberSignIn = () => {
    console.log("Sign In with Mobile Number selected");
    router.replace("/screens/parkingOwner/loginNUM");
  };
  const handleSignUp = () => {
    console.log("Navigate to Sign Up screen");
    router.replace("/screens/parkingOwner/signUp");
  };

  return (
    <View style={styles.container}>
      {/* Top Safe Area Background */}
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <StatusBar barStyle="light-content" />

        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 10 }]}
          onPress={() => router.replace("/loginSelection")}
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
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <Image
              source={require("../../../assets/appImages/vehicleOwnerLoginSelection.png")}
              style={{ width: 240, height: 240 }}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>Vehicle Owner Sign In</Text>

          {/* Already Registered */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>
              Don't have an account?{" "}
              <Text style={styles.loginLink} onPress={handleSignUp}>
                Sign Up
              </Text>
            </Text>
          </View>

          {/* Sign In Options */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleDigitalNICSignIn}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="card-outline" size={32} color="#FFFFFF" />
                </View>
                <View style={styles.textContent}>
                  <Text style={styles.buttonTitle}>
                    Sign In with Digital NIC
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleMobileNumberSignIn}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="phone-portrait-outline"
                    size={32}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.textContent}>
                  <Text style={styles.buttonTitle}>
                    Sign In with Mobile Number
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
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
    backgroundColor: "#000000",
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
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoPlaceholder: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoText: {
    fontSize: 32,
    fontFamily: "Poppins-Bold",
    color: "#2E7D32",
    letterSpacing: 2,
  },
  logoSubtext: {
    fontSize: 20,
    fontFamily: "Poppins-Medium",
    color: "#4CAF50",
    letterSpacing: 3,
  },
  tagline: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#000000",
    fontStyle: "italic",
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 8,
  },
  loginContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  loginText: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#000000",
  },
  loginLink: {
    fontFamily: "Poppins-Bold",
    textDecorationLine: "underline",
    color: "#093F86",
  },
  optionsContainer: {
    gap: 20,
    paddingHorizontal: 10,
  },
  optionButton: {
    backgroundColor: "#093F86",
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  textContent: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 18,
    textAlign: "left",
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
});

export default VehicleOwnerSignIn;
