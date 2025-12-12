import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, RefreshControl, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { ENDPOINTS } from '../../constants/Config';

const COMPANY_URL = ENDPOINTS.COMPANY;

type Passenger = {
    ticket_id: string;
    passenger_name: string;
    status: string;
    route_info: string;
    created_at: string;
};

export default function PassengersScreen() {
    const { token } = useAuth();
    const [passengers, setPassengers] = useState<Passenger[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPassengers = async () => {
        try {
            const response = await axios.get(`${COMPANY_URL}/api/v1/driver-api/passengers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPassengers(response.data);
        } catch (e) {
            console.error("Failed to fetch passengers", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPassengers();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchPassengers();
        setRefreshing(false);
    }, []);

    const renderItem = ({ item }: { item: Passenger }) => (
        <View style={styles.card}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.passenger_name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.passenger_name}</Text>
                <Text style={styles.route}>{item.route_info}</Text>
                <Text style={styles.ticketId}>Ticket: {item.ticket_id.slice(0, 8)}...</Text>
            </View>
            <View>
                <Text style={[styles.status, item.status === 'active' || item.status === 'booked' ? styles.active : styles.inactive]}>
                    {item.status}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Passenger List</Text>
                <Text style={styles.subtitle}>{passengers.length} Active Tickets</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={passengers}
                    keyExtractor={(item) => item.ticket_id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No passengers found for this bus.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    title: { fontSize: 24, fontWeight: 'bold' },
    subtitle: { color: '#666', marginTop: 5 },

    listContent: { padding: 15 },
    card: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },

    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    avatarText: { fontSize: 20, fontWeight: 'bold', color: '#2196F3' },

    name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    route: { fontSize: 14, color: '#666' },
    ticketId: { fontSize: 12, color: '#999', marginTop: 2 },

    status: { fontSize: 12, fontWeight: 'bold', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, overflow: 'hidden' },
    active: { backgroundColor: '#E8F5E9', color: '#4CAF50' },
    inactive: { backgroundColor: '#FFEBEE', color: '#F44336' },

    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#888', fontSize: 16 }
});
