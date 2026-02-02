import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT, UrlTile } from "react-native-maps";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import parkingZoneService, {
  ParkingZone,
} from "../../../services/parkingZoneService";

const ViewParking = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [selectedParking, setSelectedParking] = useState<ParkingZone | null>(
    null
  );
  const [parkingZones, setParkingZones] = useState<ParkingZone[]>([]);
  const [userLocation, setUserLocation] = useState({
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [locationSubscription, setLocationSubscription] =
    useState<Location.LocationSubscription | null>(null);

  useEffect(() => {
    loadParkingZones();
    requestLocationPermission();

    return () => {
      // Cleanup location subscription on unmount
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status: foregroundStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "Please enable location services to see your current position on the map."
        );
        setHasLocationPermission(false);
        return;
      }

      setHasLocationPermission(true);

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });

      // Watch location changes
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (newLocation: Location.LocationObject) => {
          setUserLocation({
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          });
        }
      );

      setLocationSubscription(subscription);
    } catch (error) {
      console.error("Error requesting location permission:", error);
      Alert.alert(
        "Error",
        "Failed to get location. Please check your device settings."
      );
    }
  };

  const loadParkingZones = async () => {
    try {
      setLoading(true);
      console.log("🔄 Starting to load parking zones...");

      const zones = await parkingZoneService.getAllParkingZones();
      console.log("✅ Total zones fetched:", zones.length);
      console.log("📊 All zones:", JSON.stringify(zones, null, 2));

      // Filter only active zones with valid coordinates
      const validZones = zones.filter((zone) => {
        const isActive = zone.status === "active";
        const hasLatitude =
          zone.latitude !== undefined && zone.latitude !== null;
        const hasLongitude =
          zone.longitude !== undefined && zone.longitude !== null;

        console.log(`Zone ${zone.zoneCode}:`, {
          status: zone.status,
          isActive,
          latitude: zone.latitude,
          hasLatitude,
          longitude: zone.longitude,
          hasLongitude,
          willShow: isActive && hasLatitude && hasLongitude,
        });

        return isActive && hasLatitude && hasLongitude;
      });

      console.log("✅ Valid zones with coordinates:", validZones.length);
      console.log(
        "📍 Valid zones details:",
        JSON.stringify(validZones, null, 2)
      );

      setParkingZones(validZones);

      if (validZones.length === 0) {
        console.log("⚠️ No valid zones found. Check:");
        console.log("1. Are zones marked as 'active'?");
        console.log("2. Do zones have latitude and longitude?");
        console.log("3. DynamoDB data:", zones);
      }
    } catch (error: any) {
      console.error("❌ Error loading parking zones:", error);
      console.error("Error details:", error.message, error.stack);
      Alert.alert("Error", error.message || "Failed to load parking zones");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (parking: ParkingZone) => {
    setSelectedParking(parking);
  };

  const handleBookParking = (parking: ParkingZone) => {
    Alert.alert(
      "Book Parking",
      `Do you want to book a spot at ${parking.municipalCouncil} - Zone ${parking.zoneCode}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Book Now",
          onPress: () => {
            Alert.alert("Success", "Parking spot booked successfully!");
            setSelectedParking(null);
          },
        },
      ]
    );
  };

  const handleNavigateToParking = async (parking: ParkingZone) => {
    try {
      const destination = `${parking.latitude},${parking.longitude}`;
      const label = `${parking.municipalCouncil} - Zone ${parking.zoneCode}`;

      let url = "";

      if (Platform.OS === "ios") {
        // For iOS, use Apple Maps or Google Maps
        url = `maps://app?daddr=${destination}&dirflg=d`;

        // Check if Apple Maps is available
        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) {
          // Fallback to Google Maps on iOS
          url = `comgooglemaps://?daddr=${destination}&directionsmode=driving`;
          const canOpenGoogle = await Linking.canOpenURL(url);
          if (!canOpenGoogle) {
            // Final fallback to Google Maps web
            url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
          }
        }
      } else {
        // For Android, use Google Maps
        url = `google.navigation:q=${destination}&mode=d`;

        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) {
          // Fallback to Google Maps web
          url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
        }
      }

      await Linking.openURL(url);
    } catch (error) {
      console.error("Error opening maps:", error);
      Alert.alert(
        "Error",
        "Could not open maps. Please make sure you have a maps app installed."
      );
    }
  };

  const getAvailabilityColor = () => {
    // Default color for active zones
    return "#4CAF50";
  };

  return (
    <View style={styles.container}>
      {/* Top Safe Area Background */}
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>View Public Parking Areas</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={loadParkingZones}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Debug Info Banner */}
        {__DEV__ && (
          <View style={styles.debugBanner}>
            <Text style={styles.debugText}>
              Loaded: {parkingZones.length} zones | Status:{" "}
              {loading ? "Loading..." : "Ready"}
            </Text>
          </View>
        )}

        {/* Map Container */}
        <View style={styles.mapContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#093F86" />
              <Text style={styles.loadingText}>Loading parking areas...</Text>
            </View>
          ) : (
            <MapView
              style={styles.map}
              provider={PROVIDER_DEFAULT}
              initialRegion={userLocation}
              showsUserLocation={true}
              showsMyLocationButton={true}
              showsCompass={true}
              showsScale={true}
              mapType="standard"
            >
              {/* CartoDB Light Tiles (Completely Free & No Restrictions!) */}
              <UrlTile
                urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
                maximumZ={19}
                minimumZ={1}
                tileSize={256}
                flipY={false}
                shouldReplaceMapContent={true}
              />

              {/* Parking Area Markers */}
              {parkingZones.map((parking) => (
                <Marker
                  key={parking.id}
                  coordinate={{
                    latitude: parking.latitude!,
                    longitude: parking.longitude!,
                  }}
                  onPress={() => handleMarkerPress(parking)}
                >
                  <View style={styles.markerContainer}>
                    <View
                      style={[
                        styles.markerCircle,
                        {
                          backgroundColor: "#4CAF50",
                        },
                      ]}
                    >
                      <Ionicons name="car" size={20} color="#FFFFFF" />
                    </View>
                    {selectedParking?.id === parking.id && (
                      <View style={styles.markerPulse} />
                    )}
                  </View>
                </Marker>
              ))}
            </MapView>
          )}

          {/* Empty State - No Parking Zones */}
          {!loading && parkingZones.length === 0 && (
            <View style={styles.emptyStateOverlay}>
              <View style={styles.emptyStateCard}>
                <Ionicons name="location-outline" size={64} color="#CCC" />
                <Text style={styles.emptyStateTitle}>
                  No Parking Zones Found
                </Text>
                <Text style={styles.emptyStateText}>
                  There are no active parking zones configured yet.
                </Text>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={loadParkingZones}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={20} color="#FFFFFF" />
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Legend */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#4CAF50" }]}
              />
              <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#FF9800" }]}
              />
              <Text style={styles.legendText}>Limited</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#F44336" }]}
              />
              <Text style={styles.legendText}>Full</Text>
            </View>
          </View>
        </View>

        {/* Parking Details Card */}
        {selectedParking && (
          <View style={styles.detailsCard}>
            <View style={styles.detailsHeader}>
              <View style={styles.detailsHeaderLeft}>
                <Text style={styles.parkingName}>
                  {selectedParking.municipalCouncil}
                </Text>
                <View style={styles.availabilityRow}>
                  <Ionicons name="car-sport" size={16} color="#4CAF50" />
                  <Text
                    style={[
                      styles.availabilityText,
                      {
                        color: "#4CAF50",
                      },
                    ]}
                  >
                    Zone {selectedParking.zoneCode} -{" "}
                    {selectedParking.totalParkingSpots} spots
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedParking(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.detailsContent}>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={20} color="#093F86" />
                <Text style={styles.detailText}>
                  {selectedParking.location}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="cash-outline" size={20} color="#093F86" />
                <Text style={styles.detailText}>
                  Rs. {selectedParking.parkingRate} per hour
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={20} color="#093F86" />
                <Text style={styles.detailText}>
                  {selectedParking.activeHours}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="navigate-outline" size={20} color="#093F86" />
                <Text style={styles.detailText}>
                  {selectedParking.latitude?.toFixed(6)},{" "}
                  {selectedParking.longitude?.toFixed(6)}
                </Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.navigateButton}
                onPress={() => handleNavigateToParking(selectedParking)}
                activeOpacity={0.8}
              >
                <Ionicons name="navigate" size={20} color="#FFFFFF" />
                <Text style={styles.navigateButtonText}>Get Directions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bookButton}
                onPress={() => handleBookParking(selectedParking)}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar" size={20} color="#FFFFFF" />
                <Text style={styles.bookButtonText}>Book Parking</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Parking List View */}
        {!selectedParking && parkingZones.length > 0 && (
          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>
              Nearby Parking Areas ({parkingZones.length})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listScroll}
            >
              {parkingZones.map((parking) => (
                <TouchableOpacity
                  key={parking.id}
                  style={styles.listCard}
                  onPress={() => handleMarkerPress(parking)}
                  activeOpacity={0.8}
                >
                  <View style={styles.listCardHeader}>
                    <View
                      style={[
                        styles.listCardDot,
                        {
                          backgroundColor: "#4CAF50",
                        },
                      ]}
                    />
                    <Text style={styles.listCardName} numberOfLines={1}>
                      {parking.location}
                    </Text>
                  </View>
                  <Text style={styles.listCardSpots}>
                    Zone {parking.zoneCode} - {parking.totalParkingSpots} spots
                  </Text>
                  <Text style={styles.listCardPrice}>
                    Rs. {parking.parkingRate}/hr
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  topSafeArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#093F86",
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    backgroundColor: "#093F86",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    width: 40,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerPulse: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(9, 63, 134, 0.3)",
    borderWidth: 2,
    borderColor: "#093F86",
  },
  legendContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    fontFamily: "Poppins-Regular",
    color: "#333",
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  detailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  detailsHeaderLeft: {
    flex: 1,
  },
  parkingName: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    marginBottom: 4,
  },
  availabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  availabilityText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
  },
  closeButton: {
    padding: 4,
  },
  detailsContent: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  detailText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#333",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  navigateButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  navigateButtonText: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  bookButton: {
    flex: 1,
    backgroundColor: "#093F86",
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  bookButtonDisabled: {
    backgroundColor: "#B0BEC5",
  },
  bookButtonText: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  listContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  listTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  listScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  listCard: {
    width: 140,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 12,
    marginRight: 8,
  },
  listCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  listCardDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  listCardName: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    color: "#000000",
    flex: 1,
  },
  listCardSpots: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666",
    marginBottom: 4,
  },
  listCardPrice: {
    fontSize: 13,
    fontFamily: "Poppins-SemiBold",
    color: "#093F86",
  },
  emptyStateOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 20,
  },
  emptyStateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxWidth: 320,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: "#093F86",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  debugBanner: {
    backgroundColor: "#FFF3CD",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE69C",
  },
  debugText: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#856404",
    textAlign: "center",
  },
});

export default ViewParking;
