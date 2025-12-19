import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Box, Typography, Paper } from '@mui/material';

// Fix icons
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
    bus_id: string; // Enriched by backend
    traffic_status?: string;
}

const LiveTrafficMap = () => {
    const [buses, setBuses] = useState<Record<string, BusLocation>>({});
    const ws = useRef<WebSocket | null>(null);
    const [status, setStatus] = useState("Connecting...");

    useEffect(() => {
        // Connect to 'all' channel
        const wsBase = import.meta.env.VITE_WS_URL || 'ws://3.12.248.83:8009';
        const wsUrl = `${wsBase}/ws/tracking/all`;

        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            setStatus("Live Tracking Active");
        };

        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.bus_id && data.latitude) {
                    setBuses(prev => ({
                        ...prev,
                        [data.bus_id]: data
                    }));
                }
            } catch (e) {
                console.error(e);
            }
        };

        ws.current.onclose = () => setStatus("Disconnected");

        return () => {
            ws.current?.close();
        }
    }, []);

    // Center map on Kigali or default location
    const defaultCenter = { lat: -1.9441, lng: 30.0619 }; // Kigali

    return (
        <Paper elevation={3} sx={{ p: 2, borderRadius: 3, height: '500px', display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="h6" fontWeight="bold">Live Traffic Overview</Typography>
                <Box>
                    <Typography variant="caption" sx={{ color: status === 'Disconnected' ? 'red' : 'green' }}>
                        ● {status}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {Object.keys(buses).length} Buses Active
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ flexGrow: 1, borderRadius: 2, overflow: 'hidden' }}>
                <MapContainer
                    center={[defaultCenter.lat, defaultCenter.lng]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; CARTO'
                    />

                    {Object.values(buses).map((bus) => (
                        <Marker key={bus.bus_id} position={[bus.latitude, bus.longitude]}>
                            <Popup>
                                <b>Bus ID: {bus.bus_id}</b><br />
                                Speed: {Math.round(bus.speed * 3.6)} km/h<br />
                                Status: {bus.traffic_status}
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </Box>
        </Paper>
    );
};

export default LiveTrafficMap;
