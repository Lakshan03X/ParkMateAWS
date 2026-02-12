import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import authService from "./services/authService";

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      if (isAuthenticated) {
        const userData = await authService.getUserData();
        if (userData) {
          console.log("✅ User already logged in, redirecting to dashboard");
          // Redirect to dashboard with user data
          router.replace({
            pathname: "/screens/parkingOwner/ownerDashboard",
            params: {
              userId: userData.userId,
              fullName: userData.fullName,
              mobileNumber: userData.mobileNumber,
              email: userData.email,
              nicNumber: userData.nicNumber || "",
              profileComplete: userData.profileComplete ? "true" : "false",
            },
          });
          return;
        }
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#093F86" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Top Safe Area Background */}
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <StatusBar style="light" />
        <Image
          source={require("../assets/appImages/onboardImg.png")}
          style={{ width: 240, height: 240 }}
          resizeMode="contain"
        />

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.vehicleOwnerButton]}
            onPress={() => router.replace("/screens/parkingOwner/signUp")}
          >
            <Text style={styles.buttonText}>Vehicle Owner</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.staffButton]}
            onPress={() => router.replace("/loginSelection")}
          >
            <Text style={styles.buttonText}>Staff</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  topSafeArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      fontFamily: "Poppins-Regular",
      color: "#093F86",
    },
  },
  title: {
    fontSize: 32,
    fontFamily: "Poppins-Bold",
    color: "#000000",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    fontFamily: "Poppins-Regular",
    color: "#FFFFFF",
    marginBottom: 40,
    textAlign: "center",
  },
  buttonsContainer: {
    width: "100%",
    gap: 16,
    paddingHorizontal: 20,
  },
  button: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  vehicleOwnerButton: {
    backgroundColor: "#093F86",
  },
  staffButton: {
    backgroundColor: "#2E7D32",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    textAlign: "center",
  },
});
