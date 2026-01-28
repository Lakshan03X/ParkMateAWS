import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../services/firebase";

const OwnerDashboard = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [userName, setUserName] = useState("Vehicle Owner");
  const [profileComplete, setProfileComplete] = useState(true);

  useEffect(() => {
    // Get user name from params if available
    if (params.fullName) {
      const firstName = (params.fullName as string).split(" ")[0];
      setUserName(firstName);
    }

    // Check profile completion status
    const checkProfileStatus = async () => {
      if (params.userId) {
        try {
          const userDoc = await getDoc(
            doc(db, "users", params.userId as string)
          );
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const isComplete =
              userData.profileComplete !== false && userData.nicNumber != null;
            setProfileComplete(isComplete);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        // Check from params
        setProfileComplete(params.profileComplete !== "false");
      }
    };

    checkProfileStatus();

    console.log("✅ Owner Dashboard loaded with user:", {
      userId: params.userId,
      fullName: params.fullName,
      nicNumber: params.nicNumber,
      profileComplete: params.profileComplete,
    });
  }, [params]);

  const handleProfileClick = () => {
    if (!profileComplete) {
      Alert.alert(
        "Complete Your Profile",
        "Please add your NIC information to complete your profile and access all features.",
        [
          { text: "Later", style: "cancel" },
          {
            text: "Complete Now",
            onPress: () => {
              router.push({
                pathname: "/screens/parkingOwner/profile",
                params: {
                  userId: params.userId,
                  fullName: params.fullName,
                  mobileNumber: params.mobileNumber,
                  email: params.email,
                },
              });
            },
          },
        ]
      );
    } else {
      router.push({
        pathname: "/screens/parkingOwner/profile",
        params: {
          userId: params.userId,
          fullName: params.fullName,
          mobileNumber: params.mobileNumber,
          email: params.email,
          nicNumber: params.nicNumber,
        },
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Safe Area Background */}
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <StatusBar barStyle="light-content" />

        {/* Header with Profile Icon */}
        <View style={[styles.header, { top: insets.top + 10 }]}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/loginSelection")}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Profile Icon with Warning */}
          <TouchableOpacity
            style={styles.profileButton}
            onPress={handleProfileClick}
            activeOpacity={0.7}
          >
            <View style={styles.profileIconContainer}>
              <Ionicons name="person-circle" size={40} color="#FFFFFF" />
              {!profileComplete && (
                <View style={styles.warningBadge}>
                  <Ionicons name="warning" size={16} color="#FFFFFF" />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 60 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Car Illustration */}
          <View style={styles.heroContainer}>
            <View style={styles.carContainer}>
              <Image
                source={require("../../../assets/appImages/onboardImg.png")}
                style={styles.carImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.heroTitle}>Welcome, {userName}!</Text>
          </View>

          {/* Profile Incomplete Warning */}
          {!profileComplete && (
            <TouchableOpacity
              style={styles.warningContainer}
              onPress={handleProfileClick}
              activeOpacity={0.8}
            >
              <Ionicons name="alert-circle" size={24} color="#FF9800" />
              <View style={styles.warningTextContainer}>
                <Text style={styles.warningTitle}>Complete Your Profile</Text>
                <Text style={styles.warningSubtitle}>
                  Add your NIC to access all features
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#FF9800" />
            </TouchableOpacity>
          )}

          {/* Menu Buttons */}
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuButton}
              activeOpacity={0.8}
              onPress={() =>
                router.push("/screens/parkingOwner/dashboard/scanPlate")
              }
            >
              <View style={styles.buttonContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="scan-outline" size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.menuButtonText}>
                  Scan number plate and{"\n"}apply ticket
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              activeOpacity={0.8}
              onPress={() =>
                router.push("/screens/parkingOwner/dashboard/parkingFeeSummary")
              }
            >
              <View style={styles.buttonContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="ticket-outline" size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.menuButtonText}>Active Tickets</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              activeOpacity={0.8}
              onPress={() =>
                router.push("/screens/parkingOwner/dashboard/viewParking")
              }
            >
              <View style={styles.buttonContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="location-outline" size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.menuButtonText}>
                  View Public{"\n"}Parking Areas
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              activeOpacity={0.8}
              onPress={() =>
                router.push("/screens/parkingOwner/dashboard/fines")
              }
            >
              <View style={styles.buttonContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="cash-outline" size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.menuButtonText}>Fines</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              activeOpacity={0.8}
              onPress={() =>
                router.push("/screens/parkingOwner/dashboard/ownerHistory")
              }
            >
              <View style={styles.buttonContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="time-outline" size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.menuButtonText}>History</Text>
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
    backgroundColor: "transparent",
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  profileButton: {
    padding: 4,
  },
  profileIconContainer: {
    position: "relative",
  },
  warningBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FF5722",
    borderRadius: 12,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  heroContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  carContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  carImage: {
    width: 180,
    height: 140,
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    marginHorizontal: 10,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#E65100",
    marginBottom: 2,
  },
  warningSubtitle: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#E65100",
  },
  menuContainer: {
    gap: 16,
    paddingHorizontal: 10,
  },
  menuButton: {
    backgroundColor: "#093F86",
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 24,
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
  menuButtonText: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#FFFFFF",
    lineHeight: 22,
  },
});

export default OwnerDashboard;
