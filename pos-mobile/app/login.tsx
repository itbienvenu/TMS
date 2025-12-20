import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ENDPOINTS } from '../constants/Config';

const AUTH_URL = ENDPOINTS.AUTH;

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }
        setLoading(true);
        try {
            // Agents are Company Users
            console.log(`Attempting login to: ${AUTH_URL}/company/login`);
            const response = await axios.post(`${AUTH_URL}/company/login`, {
                email: email.trim(),
                password
            });

            console.log("Login Success", response.data);

            if (response.data.access_token) {
                await login(response.data.access_token, response.data);
            }
        } catch (e: any) {
            console.error("Login Error:", e);
            const msg = e.response?.data?.detail || "Connection error. Ensure backend is running.";
            Alert.alert("Login Failed", msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.contentContainer}>
                <View style={styles.header}>
                    <Text style={styles.appTitle}>KBS POS</Text>
                    <Text style={styles.subtitle}>Agent Terminal</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.title}>Agent Login</Text>
                    <Text style={styles.instruction}>Sign in to start selling tickets</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Agent Email"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        placeholderTextColor="#999"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholderTextColor="#999"
                    />

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#004d40' }, // Darker Green for Agents
    contentContainer: { flex: 1, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 40 },
    appTitle: { fontSize: 32, fontWeight: 'bold', color: 'white' },
    subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
    form: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        borderRadius: 20,
        padding: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 8
    },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    instruction: { fontSize: 14, color: '#666', marginBottom: 25 },
    input: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0'
    },
    button: {
        backgroundColor: '#00695c',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
