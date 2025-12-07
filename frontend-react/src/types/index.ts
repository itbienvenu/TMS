// API Response Types based on OpenAPI schema

export interface User {
    id: string;
    full_name: string;
    email: string;
    phone_number?: string;
    role?: string;
    company_id?: string;
}

export interface LoginRequest {
    email?: string;
    phone_number?: string;
    password_hash: string;
}

export interface RegisterRequest {
    full_name: string;
    phone_number: string;
    email: string;
    password: string;
}

export interface Company {
    id: string;
    name: string;
    email?: string;
    phone_number?: string;
    address?: string;
    created_at: string;
}

export interface Route {
    id: string;
    origin?: string;
    destination?: string;
    company_id?: string;
    created_at?: string;
}

export interface Bus {
    id: string;
    plate_number: string;
    capacity: number;
    available_seats: number;
    created_at: string;
    route_ids: string[];
}

export interface BusWithCompany {
    id: string;
    plate_number: string;
    company?: {
        name: string;
    };
    available_seats: number;
    capacity: number;
}

export interface Ticket {
    id: string;
    user_id?: string;
    full_name?: string;
    qr_code: string;
    status: string;
    created_at: string;
    mode: string;
    route?: Record<string, any>;
    bus?: string;
    drivers?: string[];
    company_name?: string;
}

export interface TicketCreate {
    user_id: string;
    bus_id: string;
    route_id: string;
    schedule_id?: string;
}

export interface BusStation {
    id: string;
    name: string;
    location?: string;
    created_at: string;
    company_id: string;
}

export interface RouteSegment {
    id: string;
    route_id: string;
    start_station_id: string;
    end_station_id: string;
    price: number;
    stop_order: number;
    company_id: string;
}

export interface Payment {
    id: string;
    ticket_id: string;
    user_id: string;
    phone_number: string;
    amount: number;
    provider: 'momo' | 'tigocash';
    status: string;
}

export interface Role {
    id: string;
    name: string;
}

export interface Permission {
    id: string;
    name: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
}
