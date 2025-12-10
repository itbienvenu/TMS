import { Box, Typography, Paper } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import { useEffect, useState } from 'react';
import api from '../services/api';

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

            <Box display="flex" flexWrap="wrap" gap={3}>
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
        </Box>
    );
};

export default Dashboard;
