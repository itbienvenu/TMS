import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { saveTicketOffline } from '../../services/OfflineStorage';
import axios from 'axios';
import { ENDPOINTS } from '../../constants/Config';

// Mock Seats (Layout 2-2)
const TOTAL_SEATS = 30;
const SEATS = Array.from({ length: TOTAL_SEATS }, (_, i) => ({ id: i + 1, number: i + 1, status: Math.random() > 0.7 ? 'booked' : 'available' }));

export default function SeatPicker() {
    const { id: routeId, name: routeName, price } = useLocalSearchParams();
    const router = useRouter();

    const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [processing, setProcessing] = useState(false);

    // Filter available seats
    const handleSeatPress = (seatInfo: any) => {
        if (seatInfo.status === 'booked') return;
        setSelectedSeat(seatInfo.number);
        setModalVisible(true);
    };

    const confirmSale = async () => {
        if (!customerName) {
            Alert.alert("Required", "Enter Customer Name");
            return;
        }

        setProcessing(true);
        const ticketData = {
            route_id: routeId,
            bus_id: 'BUS-POS-01', // Should come from shift selection
            seat_number: selectedSeat,
            customer_name: customerName,
            amount: parseFloat(price as string),
            timestamp: new Date().toISOString()
        };

        try {
            // Attempt Online Sync
            console.log("Attempting Online Sale...");
            // await axios.post(`${ENDPOINTS.COMPANY}/pos/sale`, ticketData); 
            // For now, let's simulate a failure or direct to offline to prove the concept
            throw new Error("Force Offline for Demo");

            Alert.alert("Success", "Ticket Sold & Synced!");
        } catch (e) {
            console.log("Online failed, saving locally.");
            try {
                await saveTicketOffline(ticketData);
                Alert.alert("Offline Mode", "Ticket saved locally. Sync when online.");
            } catch (dbErr) {
                Alert.alert("Error", "Could not save ticket.");
            }
        } finally {
            setProcessing(false);
            setModalVisible(false);
            setCustomerName('');
            setSelectedSeat(null);
            router.back();
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={{ marginLeft: 15 }}>
                    <Text style={styles.headerTitle}>{routeName}</Text>
                    <Text style={styles.headerSub}>{price} RWF / Seat</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.grid}>
                <View style={styles.busFront}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>DRIVER</Text>
                </View>

                <View style={styles.seatsContainer}>
                    {SEATS.map((seat) => (
                        <TouchableOpacity
                            key={seat.id}
                            style={[
                                styles.seat,
                                seat.status === 'booked' ? styles.seatBooked : styles.seatAvailable,
                                selectedSeat === seat.number && styles.seatSelected
                            ]}
                            onPress={() => handleSeatPress(seat)}
                            disabled={seat.status === 'booked'}
                        >
                            <Text style={[
                                styles.seatText,
                                (seat.status === 'booked' || selectedSeat === seat.number) && { color: '#fff' }
                            ]}>{seat.number}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* Sale Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Confirm Sale</Text>
                        <Text style={styles.modalInfo}>Seat #{selectedSeat} • {price} RWF</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Customer Name"
                            value={customerName}
                            onChangeText={setCustomerName}
                            autoFocus
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.btn, styles.btnCancel]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={{ color: '#333' }}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.btn, styles.btnConfirm]}
                                onPress={confirmSale}
                                disabled={processing}
                            >
                                {processing ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>CASH RECEIVED</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20,
        backgroundColor: '#f5f5f5', borderBottomWidth: 1, borderColor: '#eee'
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    headerSub: { fontSize: 14, color: '#666' },

    grid: { padding: 40, alignItems: 'center' },
    busFront: {
        width: '100%', height: 40, backgroundColor: '#333',
        borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 20
    },
    seatsContainer: {
        flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%'
    },
    seat: {
        width: '22%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center',
        borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#ddd'
    },
    seatAvailable: { backgroundColor: '#fff' },
    seatBooked: { backgroundColor: '#e0e0e0', borderColor: 'transparent' },
    seatSelected: { backgroundColor: '#00695c', borderColor: '#004d40' },
    seatText: { fontSize: 16, fontWeight: 'bold', color: '#333' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 30 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
    modalInfo: { fontSize: 16, color: '#00695c', marginBottom: 20 },
    input: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 12, fontSize: 18, marginBottom: 20 },
    modalButtons: { flexDirection: 'row', gap: 15 },
    btn: { flex: 1, padding: 18, borderRadius: 12, alignItems: 'center' },
    btnCancel: { backgroundColor: '#eee' },
    btnConfirm: { backgroundColor: '#00695c' }
});
