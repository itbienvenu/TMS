import api from './axios';

export interface Schedule {
    id: string;
    bus_id: string;
    route_segment_id: string;
    departure_time: string;
    arrival_time: string;
    company_id: string;
}

export interface ScheduleSearchResult {
    id: string;
    bus_id: string;
    bus_plate_number: string;
    bus_capacity: number;
    available_seats: number;
    route_id: string;
    route_segment_id: string;
    origin: string;
    destination: string;
    price: number;
    departure_time: string;
    arrival_time: string;
    company_id: string;
    company_name: string;
}

export const schedulesApi = {
    // Create schedule (company users only)
    create: async (data: {
        bus_id: string;
        route_segment_id: string;
        departure_time: string;
        arrival_time: string;
    }): Promise<Schedule> => {
        const response = await api.post('/schedules/', data);
        return response.data;
    },

    // List schedules (company users)
    getAll: async (routeId?: string): Promise<Schedule[]> => {
        const params = routeId ? `?route_id=${routeId}` : '';
        const response = await api.get(`/schedules/${params}`);
        return response.data;
    },

    // Search schedules (public)
    search: async (params: {
        route_id?: string;
        origin_id?: string;
        destination_id?: string;
        date?: string;
    }): Promise<ScheduleSearchResult[]> => {
        const queryParams = new URLSearchParams();
        if (params.route_id) queryParams.append('route_id', params.route_id);
        if (params.origin_id) queryParams.append('origin_id', params.origin_id);
        if (params.destination_id) queryParams.append('destination_id', params.destination_id);
        if (params.date) queryParams.append('date', params.date);
        
        const response = await api.get(`/schedules/search?${queryParams.toString()}`);
        return response.data;
    },

    // Get single schedule
    getById: async (id: string): Promise<Schedule> => {
        const response = await api.get(`/schedules/${id}`);
        return response.data;
    },
};
