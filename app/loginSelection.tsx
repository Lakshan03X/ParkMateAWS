import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const LoginSelection = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const loginOptions = [
    // {
    //   id: "vehicle-owner",
    //   title: "Vehicle Owner",
    //   subtitle: "Park & Pay for parking",
    //   icon: "car-outline",
    // },
    {
      id: "parking-inspector",
      title: "Parking Inspector",
      subtitle: "Verify parking tickets",
      icon: "reader-outline",
    },
    {
      id: "municipal-officer",
      title: "Municipal Council Officer",
      subtitle: "Assign Inspectors",
      icon: "people-outline",
    },
    {
      id: "municipal-admin",
      title: "Municipal Council Admin",
      subtitle: "Council Administration",
      icon: "settings-outline",
    },
    {
      id: "fine-checker",
      title: "Fine Checker",
      subtitle: "Collect fine",
      icon: "cash-outline",
    },
    {
      id: "system-admin",
      title: "System Admin",
      subtitle: "System Management",
      icon: "construct-outline",
    },
  ];

  const handleLoginPress = (optionId: string) => {
    console.log(`Selected: ${optionId}`);

    switch (optionId) {
      case "vehicle-owner":
        router.replace("/screens/parkingOwner/signUp");
        break;
      case "parking-inspector":
        router.replace("/screens/parkingInspector/inspectorLogin");
        break;
      case "municipal-officer":
        router.replace("/screens/mcOfficer/officerLogin");
        break;
      case "municipal-admin":
        router.replace("/screens/mcAdmin/adminLogin");
        break;
      case "fine-checker":
        router.replace("/screens/fineChecker/checkerLogin");
        break;
      case "system-admin":
        router.replace("/screens/systemAdmin/sysAdminLogin");
        break;
      default:
        console.warn(`Unknown option: ${optionId}`);
    }
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
          onPress={() => router.replace("/")}
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
              source={require("../assets/appImages/onboardImg.png")}
              style={{ width: 240, height: 240, zIndex: -1 }}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>Select your login</Text>

          {/* Login Options */}
          <View style={styles.optionsContainer}>
            {loginOptions.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  index === 0 && styles.firstButton,
                  index === loginOptions.length - 1 && styles.lastButton,
                ]}
                onPress={() => handleLoginPress(option.id)}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name={option.icon as any}
                      size={32}
                      color="#FFFFFF"
                    />
                  </View>
                  <View style={styles.textContent}>
                    <Text style={styles.buttonTitle}>{option.title}</Text>
                    <Text style={styles.buttonSubtitle}>{option.subtitle}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
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
  registerContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  registerText: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#000000",
  },
  registerLink: {
    fontFamily: "Poppins-Bold",
    textDecorationLine: "underline",
  },
  optionsContainer: {
    gap: 16,
    paddingHorizontal: 10,
  },
  optionButton: {
    backgroundColor: "#093F86",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  firstButton: {
    backgroundColor: "#093F86",
  },
  lastButton: {
    backgroundColor: "#093F86",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  buttonTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#E3F2FD",
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
});

export default LoginSelection;
