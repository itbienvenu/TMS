import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { QrCode, LogOut, User, Bus } from 'lucide-react-native';

const HomeScreen = ({ navigation }) => {
    const { user, logout } = useContext(AuthContext);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Welcome back,</Text>
                    <Text style={styles.userName}>{user.name}</Text>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                    <LogOut size={24} color="#dc3545" />
                </TouchableOpacity>
            </View>

            {/* Info Card */}
            <View style={styles.card}>
                <View style={styles.cardItem}>
                    <User size={20} color="#6c757d" />
                    <Text style={styles.cardText}>Driver Account</Text>
                </View>
                {user.bus_id && (
                    <View style={[styles.cardItem, { marginTop: 12 }]}>
                        <Bus size={20} color="#6c757d" />
                        <Text style={styles.cardText}>Bus ID: {user.bus_id.slice(0, 8)}...</Text>
                    </View>
                )}
            </View>

            {/* Main Action */}
            <View style={styles.actionContainer}>
                <TouchableOpacity
                    style={styles.scanButton}
                    onPress={() => navigation.navigate('Scanner')}
                >
                    <View style={styles.scanIconBg}>
                        <QrCode size={48} color="#fff" />
                    </View>
                    <Text style={styles.scanTitle}>Scan Ticket</Text>
                    <Text style={styles.scanSubtitle}>Verify passenger QR codes</Text>
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#dee2e6',
    },
    greeting: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 4,
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#212529',
    },
    logoutButton: {
        padding: 8,
        backgroundColor: '#fff0f3', // light red
        borderRadius: 12,
    },
    card: {
        margin: 24,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 5,
    },
    cardItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardText: {
        marginLeft: 12,
        fontSize: 16,
        color: '#495057',
        fontWeight: '500',
    },
    actionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    scanButton: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#fff',
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#0d6efd",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#e7f1ff',
    },
    scanIconBg: {
        backgroundColor: '#0d6efd',
        padding: 24,
        borderRadius: 50,
        marginBottom: 24,
        shadowColor: "#0d6efd",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    scanTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 8,
    },
    scanSubtitle: {
        fontSize: 16,
        color: '#6c757d',
    },
});

export default HomeScreen;
