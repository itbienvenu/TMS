import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { ENDPOINTS, API_BASE_URL } from '../../constants/Config';
import * as Location from 'expo-location';

const COMPANY_URL = ENDPOINTS.COMPANY; // .../api/v1
// We need to target the tracking service. If via gateway:
const TRACKING_URL = `${API_BASE_URL}/tracking`;

export default function HomeScreen() {
  const { driverInfo, token, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [busData, setBusData] = useState<any>(null);
  const router = useRouter();

  // Tracking State
  const [isTracking, setIsTracking] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  const [lastLocation, setLastLocation] = useState<Location.LocationObject | null>(null);

  const fetchDriverData = async () => {
    try {
      const response = await axios.get(`${COMPANY_URL}/driver-api/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBusData(response.data);
    } catch (e) {
      console.log("Error fetching driver data", e);
    }
  };

  useEffect(() => {
    fetchDriverData();
  }, []);

  // Tracking Logic
  const startTracking = async () => {
    if (!busData?.bus?.plate_number) {
      Alert.alert("Error", "No bus assigned to you.");
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "Allow location access to start trip.");
      return;
    }

    setIsTracking(true);

    // Use plate number as bus_id for MVP demo consistency
    const busId = busData.bus.plate_number;

    try {
      // Create subscription
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Every 5 seconds
          distanceInterval: 10, // Or every 10 meters
        },
        async (loc) => {
          setLastLocation(loc);

          // Send to Backend
          const payload = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            speed: loc.coords.speed || 0,
            heading: loc.coords.heading || 0,
            timestamp: loc.timestamp
          };

          try {
            // Direct call to tracking service (assuming gateway forwards /tracking to tracking-service)
            // If Gateway is on 8000 and Tracking on 8009, we might need a direct port if Gateway isn't configured.
            // For now, let's try the Gateway URL first.
            await axios.post(`${TRACKING_URL}/${busId}`, payload, {
              headers: {
                'Content-Type': 'application/json',
                // 'x-driver-token': token // Optional auth
              }
            });
            console.log("Loc sent:", payload);
          } catch (err) {
            console.log("Failed to send location", err);
          }
        }
      );
      setLocationSubscription(sub);
      Alert.alert("Trip Started", "You are now live.");
    } catch (e) {
      console.log(e);
      setIsTracking(false);
      Alert.alert("Error", "Could not start tracking.");
    }
  };

  const stopTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    setIsTracking(false);
    Alert.alert("Trip Ended", "Tracking stopped.");
  };

  const toggleTrip = () => {
    if (isTracking) {
      Alert.alert("End Trip", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "End Trip", onPress: stopTracking, style: 'destructive' }
      ]);
    } else {
      startTracking();
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDriverData();
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.driverName}>{driverInfo?.driver_name || busData?.full_name || "Driver"}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        {/* Start Trip Card */}
        <TouchableOpacity
          style={[styles.tripCard, isTracking ? styles.activeTrip : styles.inactiveTrip]}
          onPress={toggleTrip}
          activeOpacity={0.8}
        >
          <View style={styles.tripIcon}>
            <Ionicons name={isTracking ? "stop-circle" : "play-circle"} size={64} color="white" />
          </View>
          <Text style={styles.tripText}>
            {isTracking ? "END TRIP" : "START TRIP"}
          </Text>
          {isTracking && (
            <View style={styles.liveIndicator}>
              <ActivityIndicator color="white" size="small" />
              <Text style={{ color: 'white', marginLeft: 8 }}>LIVE TRACKING</Text>
            </View>
          )}
        </TouchableOpacity>

        {busData?.bus ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Current Bus</Text>
            <View style={styles.row}>
              <Ionicons name="bus-outline" size={40} color="#2196F3" />
              <View style={{ marginLeft: 15 }}>
                <Text style={styles.busPlate}>{busData.bus.plate_number}</Text>
                <Text style={styles.busInfo}>Capacity: {busData.bus.capacity} Seats</Text>
                <Text style={styles.busInfo}>Available: {busData.bus.available_seats}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.card, { alignItems: 'center' }]}>
            <Text style={{ color: '#666' }}>No Bus Assigned</Text>
          </View>
        )}

        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/scan')}>
            <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="qr-code-outline" size={32} color="#2196F3" />
            </View>
            <Text style={styles.actionText}>Scan Ticket</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/passengers')}>
            <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="people-outline" size={32} color="#4CAF50" />
            </View>
            <Text style={styles.actionText}>Passenger List</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContent: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  greeting: { fontSize: 16, color: '#666' },
  driverName: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  logoutBtn: { padding: 10, borderRadius: 10, backgroundColor: '#fcebe9' },

  tripCard: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6
  },
  inactiveTrip: { backgroundColor: '#2196F3' },
  activeTrip: { backgroundColor: '#FF3B30' },
  tripIcon: { marginBottom: 10 },
  tripText: { color: 'white', fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  liveIndicator: { flexDirection: 'row', marginTop: 10, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },

  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#888', marginBottom: 15, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center' },
  busPlate: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  busInfo: { color: '#666', marginTop: 2 },

  actionsGrid: { flexDirection: 'row', gap: 15 },
  actionCard: { flex: 1, backgroundColor: '#fff', padding: 20, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  iconBox: { padding: 15, borderRadius: 50, marginBottom: 10 },
  actionText: { fontWeight: '600', color: '#333' }
});
