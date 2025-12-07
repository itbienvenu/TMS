import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Dimensions, Alert, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { verifyTicketQr } from '../api/auth';
import { X, CheckCircle, AlertCircle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function ScannerScreen({ navigation }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!permission) {
        // Camera permissions are still loading.
        return <View />;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <View style={styles.container}>
                <Text style={styles.message}>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="grant permission" />
            </View>
        );
    }

    const handleBarCodeScanned = async ({ type, data }) => {
        setScanned(true);
        setLoading(true);

        try {
            // Data is the JWT token
            const result = await verifyTicketQr(data);

            Alert.alert(
                result.valid ? "Verified!" : "Invalid Ticket",
                `Passenger: ${result.user_name}\nRoute: ${result.route}\nStatus: ${result.status}`,
                [
                    { text: 'Scan Next', onPress: () => { setScanned(false); setLoading(false); } },
                    { text: 'Done', onPress: () => navigation.goBack(), style: 'cancel' }
                ]
            );
        } catch (error) {
            Alert.alert(
                "Error",
                error.detail || "Failed to verify ticket",
                [{ text: 'Try Again', onPress: () => { setScanned(false); setLoading(false); } }]
            );
        }
    };

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
            />

            {/* Overlay */}
            <View style={styles.overlay}>
                {/* Top Bar */}
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                        <X color="#fff" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.overlayTitle}>Scan Ticket</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Scan Frame */}
                <View style={styles.scanFrameContainer}>
                    <View style={styles.scanFrame} />
                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <Text style={styles.loadingText}>Verifying...</Text>
                        </View>
                    )}
                </View>

                {/* Bottom Text */}
                <Text style={styles.instructionText}>Position the QR code within the frame</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'space-between',
        paddingVertical: 50,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 20,
    },
    closeButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
    },
    overlayTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    scanFrameContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanFrame: {
        width: width * 0.7,
        height: width * 0.7,
        borderWidth: 2,
        borderColor: '#0d6efd',
        borderRadius: 20,
        backgroundColor: 'transparent',
    },
    instructionText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 16,
        marginBottom: 20,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 18,
    },
    loadingText: {
        color: '#fff',
        fontWeight: 'bold',
    }
});
