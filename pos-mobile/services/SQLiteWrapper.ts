// Re-export native sqlite for mobile, mock for web (to avoid wasm crash)
import { Platform } from 'react-native';

let SQLite: any;

if (Platform.OS !== 'web') {
    SQLite = require('expo-sqlite');
} else {
    // Mock for web to prevent crash during bundling
    SQLite = {
        openDatabaseSync: () => ({
            transaction: () => { },
            execAsync: async () => { },
        }),
        openDatabase: () => ({
            transaction: () => { },
        }),
    };
}

export default SQLite;
