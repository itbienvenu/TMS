import api from './axios';

export interface Schedule {
    id: string;
    bus_id: string;
    route_segment_id: string;
    departure_time: string;
    arrival_time: string;
    company_id: string;
}

export const schedulesApi = {
    // Create schedule
    create: async (data: {
        bus_id: string;
        route_segment_id: string;
        departure_time: string;
        arrival_time: string;
    }): Promise<Schedule> => {
        const response = await api.post('/schedules/', data);
        return response.data;
    },
};
