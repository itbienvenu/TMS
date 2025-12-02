export interface User {
    id: string;
    full_name: string;
    email: string;
    phone_number?: string;
    role?: string;
    company_id?: string;
}

export interface UserCreate {
    full_name: string;
    email: string;
    phone_number: string;
    password: string;
    role_name: string;
    company_id?: string;
}

export interface LoginUser {
    email?: string;
    phone_number?: string;
    password_hash: string; // Note: Backend expects 'password_hash' but usually login sends 'password'. Checking openapi, it says password_hash.
}

export interface Token {
    access_token: string;
    token_type: string;
}

export interface Company {
    id: string;
    name: string;
    email?: string;
    phone_number?: string;
    address?: string;
    created_at: string;
}

export interface CompanyCreate {
    name: string;
    email?: string;
    phone_number?: string;
    address?: string;
}

export interface Bus {
    id: string;
    plate_number: string;
    capacity: number;
    available_seats: number;
    created_at: string;
    route_ids?: string[];
    company?: { name: string };
}

export interface BusCreate {
    plate_number: string;
    capacity: number;
    route_ids?: string[];
}

export interface Route {
    id: string;
    origin?: string;
    destination?: string;
    company_id?: string;
    created_at?: string;
    price?: number; // Inferred from context, though RouteOut in openapi didn't explicitly show price in one view, but RegisterRoute has it.
}

export interface RouteCreate {
    origin_id: string;
    destination_id: string;
    price: number;
    company_id?: string;
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

export interface Station {
    id: string;
    name: string;
    location?: string;
    created_at: string;
    company_id: string;
}

export interface StationCreate {
    name: string;
    location?: string;
}

export interface Schedule {
    id: string;
    bus_id: string;
    route_segment_id: string;
    departure_time: string;
    arrival_time: string;
    company_id: string;
}

export interface ScheduleCreate {
    bus_id: string;
    route_segment_id: string;
    departure_time: string;
    arrival_time: string;
}

export interface Ticket {
    id: string;
    user_id?: string;
    full_name?: string;
    qr_code: string;
    status: string;
    created_at: string;
    mode: string;
    route?: any;
    bus?: string;
}

export interface TicketCreate {
    user_id: string;
    bus_id: string;
    route_id: string;
}

export interface Payment {
    id: string;
    ticket_id: string;
    user_id: string;
    phone_number: string;
    amount: number;
    provider: string;
    status: string;
}

export interface Permission {
    id: string;
    name: string;
}

export interface Role {
    id: string;
    name: string;
}
