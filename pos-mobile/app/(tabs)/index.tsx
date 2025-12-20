import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { ENDPOINTS } from '../../constants/Config';

const COMPANY_URL = ENDPOINTS.COMPANY;

// Mock Data
const MOCK_ROUTES = [
  { id: '1', origin: 'Kigali', destination: 'Musanze', price: 2500, est_duration: '2h' },
  { id: '2', origin: 'Kigali', destination: 'Rubavu', price: 3500, est_duration: '3h 30m' },
];

export default function Dashboard() {
  const { driverInfo, logout, token } = useAuth(); // Agent Info
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Cash Session State
  const [sessionOpen, setSessionOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [actualCash, setActualCash] = useState('');

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${COMPANY_URL}/schedules/search?date=${new Date().toISOString().split('T')[0]}`);
      // Note: Backend 'search_schedules' returns list of schedules. 
      // We map to route-like structure for display
      if (response.data && response.data.length > 0) {
        setRoutes(response.data);
      } else {
        setRoutes(MOCK_ROUTES);
      }
    } catch (e) {
      console.log("Error fetching routes", e);
      setRoutes(MOCK_ROUTES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleStartSession = async () => {
    try {
      const payload = { agent_id: driverInfo?.id || 'unknown' };
      // Note: In real app, agent_id likely in token, but provided API takes it in body

      const res = await axios.post(`${COMPANY_URL}/pos/session/start`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSessionId(res.data.session_id);
      setSessionOpen(true);
      Alert.alert("Shift Started", "Cash Session Active. You can now sell tickets.");
    } catch (e: any) {
      Alert.alert("Error", "Failed to start shift: " + (e.response?.data?.detail || e.message));
    }
  };

  const handleEndSession = async () => {
    if (!actualCash) {
      Alert.alert("Required", "Please count and enter cash collected.");
      return;
    }

    try {
      // POST /pos/session/close?agent_id=...&actual_cash=...
      // Using query params based on python definition: def close_cash_session(agent_id, actual_cash...)
      const agentId = driverInfo?.id || 'unknown';

      const res = await axios.post(`${COMPANY_URL}/pos/session/close`, null, {
        params: { agent_id: agentId, actual_cash: parseFloat(actualCash) },
        headers: { Authorization: `Bearer ${token}` }
      });

      const { expected, actual, discrepancy, reconciled } = res.data;

      // Show Discrepancy
      let msg = `Session Closed.\nExpected: ${expected}\nActual: ${actual}\nDiff: ${discrepancy}`;
      if (!reconciled) msg += "\n⚠️ DISCREPANCY DETECTED ⚠️";
      else msg += "\n✅ Balanced";

      Alert.alert("Reconciliation Report", msg);

      setSessionOpen(false);
      setShowEndModal(false);
      setActualCash('');
    } catch (e: any) {
      Alert.alert("Error", "Failed to close session: " + (e.response?.data?.detail || e.message));
    }
  };

  const onRoutePress = (item: any) => {
    if (!sessionOpen) {
      Alert.alert("Shift Closed", "You must START SHIFT and open a Cash Session before selling tickets.");
      return;
    }

    // Check Schedule status if available in item logic
    // Assuming item is a Schedule object from search
    // Invariant 2: Ticket Cut-Off
    // Use time and status check logic on client visual, but backend enforces it.

    const tripStatus = item.status || 'Scheduled'; // Fallback
    if (tripStatus !== 'Scheduled' && tripStatus !== 'Boarding') {
      Alert.alert("Booking Closed", `Trip is ${tripStatus}. Cannot sell tickets.`);
      return;
    }

    // Navigate to Sales
    router.push(`/sales/${item.id}?name=${item.origin}-${item.destination}&price=${item.price}`);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.card, !sessionOpen && { opacity: 0.5 }]}
      onPress={() => onRoutePress(item)}
    >
      <View style={styles.iconCircle}>
        <Ionicons name="bus" size={24} color="#00695c" />
      </View>
      <View style={styles.routeInfo}>
        <Text style={styles.routeTitle}>{item.origin || item.origin_station || 'Origin'} ➝ {item.destination || item.destination_station || 'Dest'}</Text>
        <Text style={styles.routeMeta}>Dep: {item.departure_time?.split('T')[1]?.substring(0, 5) || 'Now'} • {item.price} RWF</Text>
        <Text style={{ fontSize: 12, color: 'blue' }}>{item.status || 'Scheduled'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Agent Dashboard</Text>
          <Text style={styles.userName}>{driverInfo?.full_name || 'Agent'}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      {/* Cash Session Controls */}
      <View style={styles.sessionControl}>
        {!sessionOpen ? (
          <TouchableOpacity style={styles.startBtn} onPress={handleStartSession}>
            <Text style={styles.btnText}>START SHIFT</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Text style={{ color: 'green', fontWeight: 'bold' }}>● SHIFT ACTIVE</Text>
            <TouchableOpacity style={styles.endBtn} onPress={() => setShowEndModal(true)}>
              <Text style={styles.btnText}>END SHIFT</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.actionSection}>
        <Text style={styles.sectionTitle}>Available Trips</Text>
        <FlatList
          data={routes}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRoutes} />}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No active schedules found.</Text>}
        />
      </View>

      {/* End Session Modal */}
      <Modal visible={showEndModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>End Shift & Reconcile</Text>
            <Text style={styles.label}>Enter Total Cash Collected:</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={actualCash}
              onChangeText={setActualCash}
              placeholder="e.g. 50000"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowEndModal(false)} style={styles.cancelBtn}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEndSession} style={styles.confirmBtn}>
                <Text style={{ color: 'white' }}>Submit & Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  greeting: { fontSize: 14, color: '#666' },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  logoutBtn: { padding: 10, borderRadius: 8, backgroundColor: '#ffebee' },

  sessionControl: { padding: 15, backgroundColor: '#e8f5e9', borderBottomWidth: 1, borderColor: '#c8e6c9', alignItems: 'center' },
  startBtn: { backgroundColor: '#4CAF50', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, width: '100%', alignItems: 'center' },
  endBtn: { backgroundColor: '#FF5722', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 },
  btnText: { color: 'white', fontWeight: 'bold' },

  actionSection: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#555', marginBottom: 15 },

  list: { paddingBottom: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  iconCircle: {
    width: 45, height: 45, borderRadius: 25,
    backgroundColor: '#e0f2f1',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 15
  },
  routeInfo: { flex: 1 },
  routeTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  routeMeta: { fontSize: 14, color: '#888' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', width: '80%', padding: 25, borderRadius: 15, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { marginBottom: 10, color: '#555' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, fontSize: 18, marginBottom: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelBtn: { padding: 15 },
  confirmBtn: { backgroundColor: '#000', padding: 15, borderRadius: 8 }
});
