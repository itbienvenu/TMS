import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
// Assuming AuthContext handles token storage, but accessing inside TaskManager (headless) needs direct storage access

const LOCATION_TASK_NAME = 'background-location-task';
const TRACKING_API_URL = 'http://YOUR_BACKEND_IP:8009/api/v1/tracking'; // Update with real IP

// Define the task in global scope
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
        console.error("Location Task Error:", error);
        return;
    }
    if (data) {
        const { locations } = data as any;
        const location = locations[0]; // Get latest
        if (location) {
            // We need the Bus ID. Where to get it?
            // It must be stored in SecureStore or similar persistent storage when driver logs in/selects bus.
            // For now, let's assume we stored 'current_bus_id'
            try {
                // Dynamic import or require if needed, but SecureStore is standard
                const SecureStore = require('expo-secure-store');
                const busId = await SecureStore.getItemAsync('current_bus_id');

                if (busId) {
                    await axios.post(`${TRACKING_API_URL}/${busId}`, {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        speed: location.coords.speed,
                        heading: location.coords.heading,
                        timestamp: location.timestamp
                    });
                    console.log(`Updated location for bus ${busId}`);
                }
            } catch (err) {
                console.error("Failed to send location update", err);
            }
        }
    }
});

export const startLocationTracking = async () => {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status === 'granted') {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000, // Update every 5 seconds
            distanceInterval: 10, // Or every 10 meters
            showsBackgroundLocationIndicator: true,
            foregroundService: {
                notificationTitle: "Bus Tracking Active",
                notificationBody: "Sharing location with passengers...",
            },
        });
        console.log("Background tracking started");
    } else {
        console.warn("Background permission denied");
    }
};

export const stopLocationTracking = async () => {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isRegistered) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        console.log("Background tracking stopped");
    }
};
