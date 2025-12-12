import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Alert, TouchableOpacity, ActivityIndicator, Platform, Modal } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { router } from 'expo-router';
import { ENDPOINTS } from '../../constants/Config';

const QR_URL = ENDPOINTS.QR;

export default function ScanScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const { token } = useAuth();
    const isFocused = useIsFocused(); // Only active camera when focused

    if (!permission) {
        // Camera permissions are still loading.
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ marginBottom: 10 }}>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="grant permission" />
            </View>
        );
    }

    const handleBarCodeScanned = async ({ type, data }: { type: string, data: string }) => {
        if (scanned || loading) return;
        setScanned(true);
        setLoading(true);
        console.log(`Bar code with type ${type} and data ${data} has been scanned!`);

        try {
            // Verify with Backend
            const response = await axios.post(`${QR_URL}/api/v1/qr/verify`, {
                qr_token: data  // Ensure backend expects wrapped json or just string? 
                // In qr.py: qr_token: str = Body(..., embed=True) -> expects {"qr_token": "..."}
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log("Verification Result:", response.data);
            setResult({ success: true, data: response.data });
        } catch (e: any) {
            console.error("Verification Failed:", e.response?.data || e.message);
            setResult({ success: false, error: e.response?.data?.detail || "Invalid Ticket or verify failed" });
        } finally {
            setLoading(false);
        }
    };

    const closeResult = () => {
        setResult(null);
        setScanned(false);
    };

    return (
        <View style={styles.container}>
            {isFocused && (
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ["qr"],
                    }}
                />
            )}

            {/* Overlay */}
            <View style={styles.overlay}>
                <View style={styles.scanFrame} />
                <Text style={styles.scanText}>Align QR code within the frame</Text>
            </View>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={{ color: '#fff', marginTop: 10 }}>Verifying...</Text>
                </View>
            )}

            {/* Result Modal */}
            <Modal visible={!!result} transparent animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={[styles.modalContent, result?.success ? styles.successBorder : styles.errorBorder]}>
                        <View style={[styles.iconContainer, { backgroundColor: result?.success ? '#E8F5E9' : '#FFEBEE' }]}>
                            <Ionicons
                                name={result?.success ? "checkmark-circle" : "alert-circle"}
                                size={50}
                                color={result?.success ? "#4CAF50" : "#F44336"}
                            />
                        </View>

                        <Text style={styles.resultTitle}>{result?.success ? "Ticket Valid" : "Invalid Ticket"}</Text>

                        {result?.success ? (
                            <View style={styles.ticketDetails}>
                                <Text style={styles.detailLabel}>Passenger:</Text>
                                <Text style={styles.detailValue}>{result.data.user_name}</Text>

                                <Text style={styles.detailLabel}>Journey:</Text>
                                <Text style={styles.detailValue}>{result.data.route}</Text>

                                <Text style={styles.detailLabel}>Status:</Text>
                                <Text style={[styles.detailValue, { color: '#4CAF50', fontWeight: 'bold' }]}>
                                    {result.data.status}
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.errorText}>{result?.error}</Text>
                        )}

                        <TouchableOpacity style={styles.closeButton} onPress={closeResult}>
                            <Text style={styles.closeButtonText}>{result?.success ? "Scan Next" : "Try Again"}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
    scanFrame: { width: 250, height: 250, borderWidth: 2, borderColor: '#fff', borderRadius: 20, backgroundColor: 'transparent' },
    scanText: { color: '#fff', marginTop: 20, fontSize: 16, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 5 },

    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },

    modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 30, alignItems: 'center' },
    successBorder: { borderTopWidth: 5, borderTopColor: '#4CAF50' },
    errorBorder: { borderTopWidth: 5, borderTopColor: '#F44336' },

    iconContainer: { borderRadius: 50, padding: 10, marginBottom: 15 },
    resultTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },

    ticketDetails: { width: '100%', marginBottom: 20 },
    detailLabel: { fontSize: 14, color: '#888', marginTop: 10 },
    detailValue: { fontSize: 18, color: '#333', fontWeight: '500' },

    errorText: { color: '#F44336', fontSize: 16, textAlign: 'center', marginBottom: 20 },

    closeButton: { backgroundColor: '#2196F3', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 10, width: '100%', alignItems: 'center' },
    closeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
