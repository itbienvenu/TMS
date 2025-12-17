import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useParams } from 'react-router-dom';
import L from 'leaflet';
import api from '../api/axios';

// Fix for default marker icon in React-Leaflet
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface BusLocation {
    latitude: number;
    longitude: number;
    speed: number;
    timestamp: number;
}

const TrackBus: React.FC = () => {
    const { ticketId } = useParams<{ ticketId: string }>();
    const [location, setLocation] = useState<BusLocation | null>(null);
    const [busId, setBusId] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('Loading...');
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Fetch ticket details to get bus ID
        const fetchTicket = async () => {
            try {
                // We might need a specific endpoint to get tracking info
                // For MVP, assume we have a way to get bus_id from ticket
                // const res = await api.get(`/tickets/${ticketId}`); 
                // However, our tickets API returns bus plate, maybe not ID.
                // Let's assume we implement GET /tickets/{id} that returns bus_id.

                // Mocking for now as we don't have the endpoint ready in this turn
                // setBusId("mock-bus-id"); 

                // Let's rely on user passing busId from query params or fetch it properly
                // For demonstration, I'll attempt to fetch status tool logic
                // Actually, let's use the 'get_ticket_status' tool logic? No, use API.

                // Fallback:
                setStatus('Connecting to tracking...');
                // In real app: fetch busId from backend
                setBusId('test-bus-1');
            } catch (e) {
                setStatus('Failed to load ticket details.');
            }
        };
        fetchTicket();
    }, [ticketId]);

    useEffect(() => {
        if (!busId) return;

        // Connect WS
        // URL: ws://localhost:8009/ws/tracking/{bus_id}
        // Use environment variable or relative path
        const wsUrl = `ws://3.12.248.83:8009/ws/tracking/${busId}`;

        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            setStatus('Live Tracking Connected');
        };

        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.latitude && data.longitude) {
                    setLocation(data);
                }
            } catch (e) {
                console.error("WS Parse Error", e);
            }
        };

        ws.current.onclose = () => {
            setStatus('Tracking Disconnected');
        };

        return () => {
            ws.current?.close();
        };
    }, [busId]);

    if (!location) {
        return (
            <div className="container mt-5 text-center">
                <h3>{status}</h3>
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mutate">Waiting for driver location...</p>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <h2>Live Bus Tracking</h2>
            <div className="alert alert-info">
                Status: {status} | Speed: {Math.round(location.speed * 3.6)} km/h
            </div>

            <div style={{ height: '500px', width: '100%', borderRadius: '10px', overflow: 'hidden' }}>
                <MapContainer
                    center={[location.latitude, location.longitude]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                    />
                    <Marker position={[location.latitude, location.longitude]}>
                        <Popup>
                            Bus is here.<br />
                            Last update: {new Date(location.timestamp).toLocaleTimeString()}
                        </Popup>
                    </Marker>
                </MapContainer>
            </div>
        </div>
    );
};

export default TrackBus;
