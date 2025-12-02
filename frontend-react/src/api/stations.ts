import api from './axios';
import type { BusStation } from '../types';

export const stationsApi = {
    // Get all stations
    getAll: async (): Promise<BusStation[]> => {
        const response = await api.get('/stations/');
        return response.data;
    },

    // Create station
    create: async (data: { name: string; location?: string }): Promise<BusStation> => {
        const response = await api.post('/stations/', data);
        return response.data;
    },

    // Delete station
    delete: async (id: string): Promise<void> => {
        await api.delete(`/stations/${id}`);
    },
};
