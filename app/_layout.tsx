import { GradientView } from "@/components/gradient-view";
import { Gradients } from "@/constants/theme";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    "Poppins-Black": require("../assets/fonts/Poppins-Black.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GradientView colors={Gradients.primary}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "transparent" },
            gestureEnabled: true,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="loginSelection" />
          <Stack.Screen name="screens/parkingOwner/signUp" />
          <Stack.Screen name="screens/parkingOwner/registerNIC" />
          <Stack.Screen name="screens/parkingOwner/ownerDashboard" />
          <Stack.Screen name="screens/parkingOwner/dashboard/scanPlate" />
          <Stack.Screen name="screens/parkingOwner/dashboard/detectedFine" />
          <Stack.Screen name="screens/parkingOwner/dashboard/undetectedFine" />
          <Stack.Screen name="screens/parkingOwner/dashboard/activeTicket" />
          <Stack.Screen name="screens/parkingOwner/dashboard/viewParking" />
          <Stack.Screen name="screens/parkingOwner/dashboard/parkingFeeSummary" />
          <Stack.Screen name="screens/parkingOwner/dashboard/fines" />
          <Stack.Screen name="screens/parkingOwner/dashboard/ownerHistory" />
          <Stack.Screen name="screens/parkingInspector/inspectorLogin" />
          <Stack.Screen name="screens/parkingInspector/inspectorOtpVerify" />
          <Stack.Screen name="screens/parkingInspector/inspectorDash" />
          <Stack.Screen name="screens/parkingInspector/InspectorProfile" />
          <Stack.Screen name="screens/parkingInspector/inspectorActivity" />
          <Stack.Screen name="screens/parkingInspector/inspectorActivityNotfy" />
          <Stack.Screen name="screens/parkingInspector/inspectorZoneMap" />
          <Stack.Screen name="screens/mcOfficer/officerLogin" />
          <Stack.Screen name="screens/mcOfficer/mcOfficerCouncilSelection" />
          <Stack.Screen name="screens/mcOfficer/mcOfficerDashboard" />
          <Stack.Screen name="screens/mcAdmin/adminLogin" />
          <Stack.Screen name="screens/mcAdmin/mcAdminDashboard" />
          <Stack.Screen name="screens/mcAdmin/configureZone" />
          <Stack.Screen name="screens/mcAdmin/parkingRevenue" />
          <Stack.Screen name="screens/mcAdmin/mcInspectorManage" />
          <Stack.Screen name="screens/fineChecker/checkerLogin" />
          <Stack.Screen name="screens/fineChecker/fineCheckerDashboard" />
          <Stack.Screen name="screens/fineChecker/checkerProfile" />
          <Stack.Screen name="screens/systemAdmin/sysAdminLogin" />
          <Stack.Screen name="screens/systemAdmin/sysAdminDashboard" />
          <Stack.Screen name="screens/systemAdmin/dashboard/ownerManage" />
          <Stack.Screen name="screens/systemAdmin/dashboard/mcOfficerManage" />
          <Stack.Screen name="screens/systemAdmin/dashboard/sysAdminEditMCOfficer" />
          <Stack.Screen name="screens/systemAdmin/dashboard/inspectorManage" />
        </Stack>
      </GradientView>
    </SafeAreaProvider>
  );
}
