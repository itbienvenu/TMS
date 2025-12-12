import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { ENDPOINTS } from '../../constants/Config';

const COMPANY_URL = ENDPOINTS.COMPANY;

export default function HomeScreen() {
  const { driverInfo, token, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [busData, setBusData] = useState<any>(null);
  const router = useRouter();

  const fetchDriverData = async () => {
    try {
      const response = await axios.get(`${COMPANY_URL}/api/v1/driver-api/me`, {
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
