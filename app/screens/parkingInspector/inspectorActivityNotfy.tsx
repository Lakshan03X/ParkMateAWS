import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

interface Notification {
  id: string;
  type: "assignment" | "scan" | "violation" | "general";
  zoneName: string;
  timeRange: string;
  date: string;
  timestamp: string;
  isRead: boolean;
  message?: string;
}

interface NotificationGroup {
  title: string;
  notifications: Notification[];
}

const InspectorActivityNotfy = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [notificationGroups, setNotificationGroups] = useState<
    NotificationGroup[]
  >([
    {
      title: "New",
      notifications: [
        {
          id: "1",
          type: "assignment",
          zoneName: "Zone A - School Lane",
          timeRange: "From 8.00 AM to 2.00 PM",
          date: "28/07/2025",
          timestamp: "2 min",
          isRead: false,
          message: "You are assigned to,",
        },
      ],
    },
    {
      title: "Yesterday",
      notifications: [
        {
          id: "2",
          type: "assignment",
          zoneName: "Zone A - School Lane",
          timeRange: "From 8.00 AM to 2.00 PM",
          date: "28/07/2025",
          timestamp: "1 d",
          isRead: true,
        },
      ],
    },
    {
      title: "Previous",
      notifications: [
        {
          id: "3",
          type: "assignment",
          zoneName: "Zone B - Market Road",
          timeRange: "From 3.00 PM to 5.00 PM",
          date: "26/07/2025",
          timestamp: "2 d",
          isRead: true,
        },
        {
          id: "4",
          type: "assignment",
          zoneName: "Zone C - Hospital Road",
          timeRange: "From 8.00 AM to 2.00 PM",
          date: "24/07/2025",
          timestamp: "3 d",
          isRead: true,
        },
      ],
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      // TODO: Fetch notifications from service
      // const notifications = await inspectorService.getNotifications();
      // setNotificationGroups(notifications);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    console.log("Notification pressed:", notification.id);
    // Mark as read and navigate to details if needed
    // You can navigate to a specific screen based on notification type
    if (notification.type === "assignment") {
      router.push("/screens/parkingInspector/inspectorActivity");
    }
  };

  const renderNotificationCard = (notification: Notification) => {
    return (
      <TouchableOpacity
        key={notification.id}
        style={[
          styles.notificationCard,
          !notification.isRead && styles.unreadCard,
        ]}
        onPress={() => handleNotificationPress(notification)}
        activeOpacity={0.7}
      >
        {notification.message && (
          <Text style={styles.notificationMessage}>{notification.message}</Text>
        )}
        <View style={styles.notificationHeader}>
          <Text style={styles.zoneName}>{notification.zoneName}</Text>
          <View style={styles.notificationMeta}>
            <Text style={styles.timestamp}>{notification.timestamp}</Text>
            <Ionicons name="location" size={20} color="#666666" />
          </View>
        </View>
        <Text style={styles.timeRange}>{notification.timeRange}</Text>
        <Text style={styles.date}>{notification.date}</Text>
      </TouchableOpacity>
    );
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
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => console.log("Bell icon pressed")}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#093F86" />
            </View>
          ) : (
            <>
              {notificationGroups.map((group, groupIndex) => (
                <View key={groupIndex} style={styles.notificationGroup}>
                  <Text style={styles.groupTitle}>{group.title}</Text>
                  {group.notifications.map((notification) =>
                    renderNotificationCard(notification)
                  )}
                </View>
              ))}

              {/* Empty State */}
              {notificationGroups.every(
                (group) => group.notifications.length === 0
              ) && (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="notifications-off-outline"
                    size={64}
                    color="#CCCCCC"
                  />
                  <Text style={styles.emptyStateText}>
                    No notifications yet
                  </Text>
                </View>
              )}
            </>
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
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#6EAD6E",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    flex: 1,
    textAlign: "center",
  },
  notificationButton: {
    padding: 8,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  notificationGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 18,
    fontFamily: "Poppins-Regular",
    color: "#999999",
    marginBottom: 12,
  },
  notificationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#6EAD6E",
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    marginBottom: 4,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  zoneName: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    flex: 1,
  },
  notificationMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#999999",
  },
  timeRange: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#999999",
    marginTop: 16,
  },
});

export default InspectorActivityNotfy;
