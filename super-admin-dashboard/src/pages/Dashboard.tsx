import { Box, Typography, Paper } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import { useEffect, useState } from 'react';
import api from '../services/api';
import LiveTrafficMap from '../components/LiveTrafficMap';

const Dashboard = () => {
    const [stats, setStats] = useState({
        companies: 0,
        activeUsers: 0 // Placeholder
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/super-admin/companies/');
                setStats(prev => ({ ...prev, companies: res.data.length }));
            } catch (err) {
                console.error(err);
            }
        }
        fetchData();
    }, []);

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" mb={3}>Dashboard</Typography>

            <Box display="flex" flexWrap="wrap" gap={3} mb={4}>
                <Box width={{ xs: '100%', sm: '50%', md: '33%' }}>
                    <Paper elevation={1} sx={{ p: 3, display: 'flex', alignItems: 'center', borderRadius: 3 }}>
                        <Box sx={{ p: 1.5, bgcolor: '#eff6ff', borderRadius: 2, mr: 2 }}>
                            <BusinessIcon sx={{ color: '#2563eb', fontSize: 32 }} />
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary">Total Companies</Typography>
                            <Typography variant="h4" fontWeight="bold">{stats.companies}</Typography>
                        </Box>
                    </Paper>
                </Box>

                <Box width={{ xs: '100%', sm: '50%', md: '33%' }}>
                    <Paper elevation={1} sx={{ p: 3, display: 'flex', alignItems: 'center', borderRadius: 3 }}>
                        <Box sx={{ p: 1.5, bgcolor: '#ecfdf5', borderRadius: 2, mr: 2 }}>
                            <PeopleIcon sx={{ color: '#059669', fontSize: 32 }} />
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary">Total Admin Users</Typography>
                            <Typography variant="h4" fontWeight="bold">--</Typography>
                        </Box>
                    </Paper>
                </Box>
            </Box>

            {/* Analytics Section */}
            <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} gap={3} mb={4}>
                {/* Revenue Chart */}
                <Box flex={1}>
                    <Paper elevation={1} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                            <Typography variant="h6" fontWeight="bold">Revenue Overview</Typography>
                            <select style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ddd' }}>
                                <option>Last 7 Days</option>
                                <option>Last 30 Days</option>
                            </select>
                        </Box>

                        <Box display="flex" alignItems="flex-end" height="200px" gap={2}>
                            {[45, 70, 35, 60, 85, 55, 90].map((val, i) => (
                                <Box key={i} flex={1} display="flex" flexDirection="column" alignItems="center" gap={1}>
                                    <Box
                                        sx={{
                                            width: '100%',
                                            bgcolor: i === 6 ? '#2563eb' : '#eff6ff', // Highlight today
                                            borderRadius: 1,
                                            transition: 'all 0.3s',
                                            '&:hover': { bgcolor: '#3b82f6', height: `${val + 10}%` }
                                        }}
                                        height={`${val}%`}
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </Box>

                {/* Operations Stats */}
                <Box flex={1}>
                    <Paper elevation={1} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                        <Typography variant="h6" fontWeight="bold" mb={3}>System Health</Typography>
                        <Box display="flex" flexDirection="column" gap={3}>
                            <Box>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography variant="body2" fontWeight="500">Server Load</Typography>
                                    <Typography variant="caption" color="success.main">Healthy</Typography>
                                </Box>
                                <Box height={8} bgcolor="#f3f4f6" borderRadius={4} overflow="hidden">
                                    <Box width="25%" height="100%" bgcolor="#10b981" />
                                </Box>
                            </Box>

                            <Box>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography variant="body2" fontWeight="500">Active WebSocket Connections</Typography>
                                    <Typography variant="caption" fontWeight="bold">1,240</Typography>
                                </Box>
                                <Box height={8} bgcolor="#f3f4f6" borderRadius={4} overflow="hidden">
                                    <Box width="65%" height="100%" bgcolor="#3b82f6" />
                                </Box>
                            </Box>

                            <Box>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography variant="body2" fontWeight="500">Payment Gateway Success Rate</Typography>
                                    <Typography variant="caption" fontWeight="bold">99.8%</Typography>
                                </Box>
                                <Box height={8} bgcolor="#f3f4f6" borderRadius={4} overflow="hidden">
                                    <Box width="99%" height="100%" bgcolor="#059669" />
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                </Box>
            </Box>

            {/* Live Traffic Section (Already Added) */}
            <Box mb={4}>
                <LiveTrafficMap />
            </Box>
        </Box>
    );
};

export default Dashboard;


