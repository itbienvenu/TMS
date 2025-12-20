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
    const trip = busData?.active_trip;
    if (!trip || trip.status !== 'In_Transit') {
      Alert.alert("Enforcement", "You must be IN TRANSIT to start tracking.");
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "Allow location access to start trip.");
      return;
    }

    setIsTracking(true);
    const busId = busData.bus.plate_number;
    const tripId = trip.id;

    try {
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        async (loc) => {
          setLastLocation(loc);
          const payload = {
            trip_id: tripId, // Invariant 4
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            speed: loc.coords.speed || 0,
            heading: loc.coords.heading || 0,
            timestamp: loc.timestamp
          };

          try {
            await axios.post(`${TRACKING_URL}/${busId}`, payload, {
              headers: { 'Content-Type': 'application/json' }
            });
            console.log("Loc sent:", payload);
          } catch (err: any) {
            console.log("Failed to send location", err.response?.data || err.message);
            if (err.response?.status === 403 || err.response?.status === 400) {
              Alert.alert("Backend Rejected", "GPS Update Rejected: " + (err.response?.data?.detail || "Invalid State"));
              setIsTracking(false);
              if (locationSubscription) locationSubscription.remove();
            }
          }
        }
      );
      setLocationSubscription(sub);
      Alert.alert("GPS Active", "Location updates started.");
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
  };

  // Trip Actions
  const handleLifecycleAction = async (action: 'board' | 'start' | 'end') => {
    const tripId = busData?.active_trip?.id;
    if (!tripId) return;

    try {
      // POST /driver-api/trip/{id}/{action}
      await axios.post(`${COMPANY_URL}/driver-api/trip/${tripId}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert("Success", `Trip Updated: ${action.toUpperCase()}`);
      fetchDriverData(); // Refresh state

      // Auto-start tracking if moving to In_Transit
      if (action === 'start') {
        // We need to wait for state refresh, but payload needs trip ID. 
        // We can manually trigger tracking if we assume success, assuming busData refresh happens fast or we pass tripId manually.
        // For robustness, let's just refresh. Driver can tap "Start GPS" if separate, but ideally "Start Trip" enables it.
        // Given the async nature, user pushes "Start Trip" -> Status becomes In_Transit -> "GPS Active" indicator shows.
      }
      if (action === 'end') {
        stopTracking();
      }
    } catch (e: any) {
      Alert.alert("Action Failed", e.response?.data?.detail || "Unknown Error");
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDriverData();
    setRefreshing(false);
  }, []);

  const renderTripControls = () => {
    const trip = busData?.active_trip;
    if (!trip) return (
      <View style={styles.card}>
        <Text>No Active Trip Assigned</Text>
      </View>
    );

    const status = trip.status;

    return (
      <View style={styles.tripCardContainer}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>STATUS: {status.toUpperCase()}</Text>
        </View>

        {status === 'Scheduled' && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FF9800' }]} onPress={() => handleLifecycleAction('board')}>
            <Ionicons name="people" size={24} color="white" />
            <Text style={styles.btnText}>START BOARDING</Text>
          </TouchableOpacity>
        )}

        {status === 'Boarding' && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]} onPress={() => handleLifecycleAction('start')}>
            <Ionicons name="bus" size={24} color="white" />
            <Text style={styles.btnText}>START TRIP</Text>
          </TouchableOpacity>
        )}

        {status === 'In_Transit' && (
          <View>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F44336', marginBottom: 10 }]} onPress={() => handleLifecycleAction('end')}>
              <Ionicons name="stop-circle" size={24} color="white" />
              <Text style={styles.btnText}>END TRIP</Text>
            </TouchableOpacity>
            {/* Explicit GPS Toggle if needed, though Start Trip could auto-invoke */}
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isTracking ? '#607D8B' : '#2196F3' }]} onPress={isTracking ? stopTracking : startTracking}>
              <Ionicons name={isTracking ? "pause" : "navigate"} size={24} color="white" />
              <Text style={styles.btnText}>{isTracking ? "STOP GPS" : "ACTIVATE GPS"}</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'Completed' && (
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="checkmark-circle" size={48} color="green" />
            <Text>Trip Completed</Text>
          </View>
        )}
      </View>
    );
  };

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

        {/* Lifecycle Controls */}
        {renderTripControls()}

        {busData?.bus && (
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
        )}

        {/* ... Actions ... */}
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

  tripCardContainer: {
    backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 20, elevation: 4
  },
  statusBadge: { backgroundColor: '#eee', padding: 8, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 15 },
  statusText: { fontWeight: 'bold', color: '#333' },
  actionBtn: { flexDirection: 'row', padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginVertical: 5 },
  btnText: { color: 'white', fontWeight: 'bold', marginLeft: 10 },

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
