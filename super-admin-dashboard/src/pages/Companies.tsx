import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

interface Company {
    id: string;
    name: string;
    email: string;
    phone_number: string;
    address: string;
    created_at: string;
}

const Companies = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone_number: '',
        address: '',
        admin_name: '',
        admin_email: '',
        admin_phone: '',
        admin_password: ''
    });
    const [error, setError] = useState('');

    const fetchCompanies = async () => {
        try {
            const response = await api.get('/super-admin/companies/');
            setCompanies(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this company?')) {
            try {
                await api.delete(`/super-admin/companies/${id}`);
                setCompanies(companies.filter(c => c.id !== id));
            } catch (err) {
                alert('Failed to delete company');
            }
        }
    };

    const handleCreate = async () => {
        try {
            await api.post('/super-admin/companies/create_company', formData);
            setOpen(false);
            setFormData({
                name: '', email: '', phone_number: '', address: '',
                admin_name: '', admin_email: '', admin_phone: '', admin_password: ''
            });
            fetchCompanies();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create company');
        }
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" fontWeight="bold">Companies</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => { setError(''); setOpen(true); }}
                >
                    New Company
                </Button>
            </Box>

            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f9fafb' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Phone</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Address</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {companies.map((company) => (
                            <TableRow key={company.id} hover>
                                <TableCell>{company.name}</TableCell>
                                <TableCell>{company.email}</TableCell>
                                <TableCell>{company.phone_number}</TableCell>
                                <TableCell>{company.address}</TableCell>
                                <TableCell align="right">
                                    <IconButton color="error" onClick={() => handleDelete(company.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {companies.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={5} align="center">No companies found</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Company</DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Company Name"
                        fullWidth
                        variant="outlined"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Email"
                        fullWidth
                        variant="outlined"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Phone Number"
                        fullWidth
                        variant="outlined"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Address"
                        fullWidth
                        variant="outlined"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />

                    <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Admin User Details</Typography>

                    <TextField
                        margin="dense"
                        label="Admin Full Name"
                        fullWidth
                        variant="outlined"
                        value={formData.admin_name}
                        onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Admin Email"
                        fullWidth
                        variant="outlined"
                        value={formData.admin_email}
                        onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Admin Phone"
                        fullWidth
                        variant="outlined"
                        value={formData.admin_phone}
                        onChange={(e) => setFormData({ ...formData, admin_phone: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Admin Password"
                        type="password"
                        fullWidth
                        variant="outlined"
                        value={formData.admin_password}
                        onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpen(false)} color="inherit">Cancel</Button>
                    <Button onClick={handleCreate} variant="contained">Create</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Companies;
