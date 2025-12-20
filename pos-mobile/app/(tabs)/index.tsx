import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { ENDPOINTS } from '../../constants/Config';

const COMPANY_URL = ENDPOINTS.COMPANY;

// Mock Data if API fails
const MOCK_ROUTES = [
  { id: '1', origin: 'Kigali', destination: 'Musanze', price: 2500, est_duration: '2h' },
  { id: '2', origin: 'Kigali', destination: 'Rubavu', price: 3500, est_duration: '3h 30m' },
  { id: '3', origin: 'Kigali', destination: 'Huye', price: 3000, est_duration: '3h' },
  { id: '4', origin: 'Musanze', destination: 'Kigali', price: 2500, est_duration: '2h' },
];

export default function Dashboard() {
  const { driverInfo, logout } = useAuth(); // Agent Info
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      // Try fetching real routes
      const response = await axios.get(`${COMPANY_URL}/search/routes?origin=&destination=`);
      if (response.data && response.data.length > 0) {
        setRoutes(response.data);
      } else {
        setRoutes(MOCK_ROUTES);
      }
    } catch (e) {
      console.log("Error fetching routes, using mock", e);
      setRoutes(MOCK_ROUTES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/sales/${item.id}?name=${item.origin}-${item.destination}&price=${item.price}`)}
    >
      <View style={styles.iconCircle}>
        <Ionicons name="bus" size={24} color="#00695c" />
      </View>
      <View style={styles.routeInfo}>
        <Text style={styles.routeTitle}>{item.origin} ➝ {item.destination}</Text>
        <Text style={styles.routeMeta}>{item.est_duration} • {item.price} RWF</Text>
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

      <View style={styles.actionSection}>
        <Text style={styles.sectionTitle}>Select Route to Sell</Text>
        <FlatList
          data={routes}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRoutes} />}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No active routes found.</Text>}
        />
      </View>
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
  routeMeta: { fontSize: 14, color: '#888' }
});
