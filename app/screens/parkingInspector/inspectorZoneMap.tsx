import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_DEFAULT, UrlTile } from "react-native-maps";

interface AssignedZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  timeRange: string;
  date: string;
  status: "active" | "upcoming" | "completed";
}

const ASSIGNED_ZONES: AssignedZone[] = [
  {
    id: "1",
    name: "Zone A - School Lane",
    latitude: 6.9271,
    longitude: 79.8612,
    timeRange: "From 8.00 AM to 2.00 PM",
    date: "28/07/2025",
    status: "active",
  },
  {
    id: "2",
    name: "Rishi Car Park",
    latitude: 6.9251,
    longitude: 79.8572,
    timeRange: "From 2.00 PM to 5.00 PM",
    date: "28/07/2025",
    status: "upcoming",
  },
  {
    id: "3",
    name: "Lionel wendt road public car park",
    latitude: 6.9191,
    longitude: 79.8582,
    timeRange: "From 8.00 AM to 12.00 PM",
    date: "27/07/2025",
    status: "completed",
  },
  {
    id: "4",
    name: "Public Parking",
    latitude: 6.9131,
    longitude: 79.8612,
    timeRange: "From 1.00 PM to 5.00 PM",
    date: "27/07/2025",
    status: "completed",
  },
];

const InspectorZoneMap = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [selectedZone, setSelectedZone] = useState<AssignedZone | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  useEffect(() => {
    loadAssignedZones();
  }, []);

  const loadAssignedZones = async () => {
    setLoading(true);
    try {
      // TODO: Fetch assigned zones from service
      // const zones = await inspectorService.getAssignedZones();
      // setAssignedZones(zones);
    } catch (error) {
      console.error("Failed to load assigned zones:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (zone: AssignedZone) => {
    setSelectedZone(zone);
  };

  const getZoneColor = (status: string) => {
    switch (status) {
      case "active":
        return "#4CAF50"; // Green for active
      case "upcoming":
        return "#FF9800"; // Orange for upcoming
      case "completed":
        return "#9E9E9E"; // Grey for completed
      default:
        return "#093F86";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Active Now";
      case "upcoming":
        return "Upcoming";
      case "completed":
        return "Completed";
      default:
        return "";
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Safe Area Background */}
      <View style={[styles.topSafeArea, { height: insets.top }]} />

      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            View Assigned Public Parking Area
          </Text>
          <View style={styles.headerRight} />
        </View>

        {/* Map Container */}
        <View style={styles.mapContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6EAD6E" />
              <Text style={styles.loadingText}>Loading assigned zones...</Text>
            </View>
          ) : (
            <MapView
              style={styles.map}
              provider={PROVIDER_DEFAULT}
              initialRegion={mapRegion}
              showsUserLocation={true}
              showsMyLocationButton={true}
              showsCompass={true}
              showsScale={true}
              mapType="standard"
            >
              {/* CartoDB Light Tiles */}
              <UrlTile
                urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
                maximumZ={19}
                minimumZ={1}
                tileSize={256}
                flipY={false}
                shouldReplaceMapContent={true}
              />

              {/* Zone Markers */}
              {ASSIGNED_ZONES.map((zone) => (
                <Marker
                  key={zone.id}
                  coordinate={{
                    latitude: zone.latitude,
                    longitude: zone.longitude,
                  }}
                  onPress={() => handleMarkerPress(zone)}
                >
                  <View style={styles.markerContainer}>
                    <View
                      style={[
                        styles.markerCircle,
                        {
                          backgroundColor: getZoneColor(zone.status),
                        },
                      ]}
                    >
                      <Ionicons name="location" size={24} color="#FFFFFF" />
                    </View>
                    {selectedZone?.id === zone.id && (
                      <View style={styles.markerPulse} />
                    )}
                  </View>
                </Marker>
              ))}
            </MapView>
          )}

          {/* Legend */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#4CAF50" }]}
              />
              <Text style={styles.legendText}>Active</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#FF9800" }]}
              />
              <Text style={styles.legendText}>Upcoming</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#9E9E9E" }]}
              />
              <Text style={styles.legendText}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Zone Details Card */}
        {selectedZone && (
          <View style={styles.detailsCard}>
            <View style={styles.detailsHeader}>
              <View style={styles.detailsHeaderLeft}>
                <Text style={styles.zoneName}>{selectedZone.name}</Text>
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: getZoneColor(selectedZone.status),
                      },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {getStatusText(selectedZone.status)}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedZone(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.detailsContent}>
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={20} color="#6EAD6E" />
                <Text style={styles.detailText}>{selectedZone.timeRange}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={20} color="#6EAD6E" />
                <Text style={styles.detailText}>{selectedZone.date}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={20} color="#6EAD6E" />
                <Text style={styles.detailText}>
                  {selectedZone.latitude.toFixed(4)},{" "}
                  {selectedZone.longitude.toFixed(4)}
                </Text>
              </View>
            </View>

            {selectedZone.status === "active" && (
              <TouchableOpacity
                style={styles.startButton}
                onPress={() =>
                  router.push("/screens/parkingInspector/inspectorScanPlate")
                }
                activeOpacity={0.8}
              >
                <Ionicons
                  name="scan-outline"
                  size={20}
                  color="#FFFFFF"
                  style={styles.buttonIcon}
                />
                <Text style={styles.startButtonText}>Start Inspection</Text>
              </TouchableOpacity>
            )}
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
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    backgroundColor: "#6EAD6E",
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
    fontSize: 16,
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
    backgroundColor: "rgba(110, 173, 110, 0.3)",
    borderWidth: 2,
    borderColor: "#6EAD6E",
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
  zoneName: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
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
  startButton: {
    backgroundColor: "#6EAD6E",
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonIcon: {
    marginRight: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
});

export default InspectorZoneMap;
