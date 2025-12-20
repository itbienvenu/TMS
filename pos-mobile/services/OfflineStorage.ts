import { Platform } from 'react-native';
import SQLite from './SQLiteWrapper';

let db: any = null;

if (Platform.OS !== 'web') {
    db = SQLite.openDatabaseSync('pos_offline.db');
}

export const initDB = () => {
    if (!db) {
        console.warn("SQLite DB not initialized (Web Mode or Failed). Skipping initDB.");
        return;
    }
    db.transaction((tx: any) => {
        // Users (Agents)
        tx.executeSql(
            `CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY, 
        email TEXT, 
        name TEXT, 
        token TEXT
      );`
        );
        // Offline Tickets
        tx.executeSql(
            `CREATE TABLE IF NOT EXISTS offline_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        route_id TEXT, 
        bus_id TEXT, 
        seat_number INTEGER, 
        customer_name TEXT,
        amount REAL,
        synced INTEGER DEFAULT 0
      );`
        );
    });
};

export const saveTicketOffline = (ticket: any) => {
    return new Promise((resolve, reject) => {
        if (!db) return reject("DB not initialized");
        db.transaction((tx: any) => {
            tx.executeSql(
                `INSERT INTO offline_tickets (route_id, bus_id, seat_number, customer_name, amount) VALUES (?, ?, ?, ?, ?)`,
                [ticket.route_id, ticket.bus_id, ticket.seat_number, ticket.customer_name, ticket.amount],
                (_: any, result: any) => resolve(result),
                (_: any, error: any) => { reject(error); return false; }
            );
        });
    });
};

export const getUnsyncedTickets = () => {
    return new Promise((resolve, reject) => {
        if (!db) return reject("DB not initialized");
        db.transaction((tx: any) => {
            tx.executeSql(
                `SELECT * FROM offline_tickets WHERE synced = 0;`,
                [],
                (_: any, { rows: { _array } }: any) => resolve(_array),
                (_: any, error: any) => { reject(error); return false; }
            );
        });
    });
};
