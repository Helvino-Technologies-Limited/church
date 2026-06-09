import React, { useState } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, TextField, Button,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Chip, Avatar, Divider, Drawer,
} from '@mui/material';
import { Add, Edit, Delete, Business, People, Phone, Email, LocationOn } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useSnackbar } from 'notistack';

const emptyForm = { name: '', address: '', city: '', phone: '', email: '' };

export default function Parishes() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['parishes'],
    queryFn: () => api.get('/tenant/parishes').then((r) => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (body: typeof form) => editId ? api.put(`/tenant/parishes/${editId}`, body) : api.post('/tenant/parishes', body),
    onSuccess: () => {
      enqueueSnackbar(editId ? 'Parish updated' : 'Parish/Branch added', { variant: 'success' });
      setDrawerOpen(false); setForm(emptyForm); setEditId(null);
      queryClient.invalidateQueries({ queryKey: ['parishes'] });
    },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Failed', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tenant/parishes/${id}`),
    onSuccess: () => { enqueueSnackbar('Parish deleted', { variant: 'success' }); setDeleteDialog(false); queryClient.invalidateQueries({ queryKey: ['parishes'] }); },
    onError: () => enqueueSnackbar('Delete failed', { variant: 'error' }),
  });

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleEdit = (p: any) => {
    setForm({ name: p.name || '', address: p.address || '', city: p.city || '', phone: p.phone || '', email: p.email || '' });
    setEditId(p.id); setDrawerOpen(true);
  };

  const parishes = data || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e' }}>Parishes & Branches</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>{parishes.length} branches configured</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm(emptyForm); setEditId(null); setDrawerOpen(true); }}>
          Add Parish / Branch
        </Button>
      </Box>

      {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}><CircularProgress /></Box> : (
        <>
          {parishes.length === 0 ? (
            <Card><CardContent sx={{ py: 8, textAlign: 'center' }}>
              <Business sx={{ fontSize: 56, color: 'rgba(26,35,126,0.2)', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#1a237e', mb: 1 }}>No Parishes or Branches Yet</Typography>
              <Typography sx={{ color: 'text.secondary', mb: 3 }}>Add your first parish or branch to get started.</Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => setDrawerOpen(true)}>Add First Parish</Button>
            </CardContent></Card>
          ) : (
            <Grid container spacing={3}>
              {parishes.map((p: any) => (
                <Grid item xs={12} sm={6} md={4} key={p.id}>
                  <Card sx={{ transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-3px)' } }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ bgcolor: '#1a237e', width: 44, height: 44 }}>
                            <Business />
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>{p.name}</Typography>
                            <Chip label={`${p._count?.members || 0} members`} size="small" icon={<People sx={{ fontSize: '12px !important' }} />} sx={{ bgcolor: 'rgba(26,35,126,0.08)', color: '#1a237e', fontSize: '0.7rem', mt: 0.3 }} />
                          </Box>
                        </Box>
                        <Box>
                          <IconButton size="small" onClick={() => handleEdit(p)}><Edit fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => { setSelected(p); setDeleteDialog(true); }} color="error"><Delete fontSize="small" /></IconButton>
                        </Box>
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      {p.address && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}><LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} /><Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>{p.city ? `${p.address}, ${p.city}` : p.address}</Typography></Box>}
                      {p.phone && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}><Phone sx={{ fontSize: 16, color: 'text.secondary' }} /><Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>{p.phone}</Typography></Box>}
                      {p.email && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Email sx={{ fontSize: 16, color: 'text.secondary' }} /><Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>{p.email}</Typography></Box>}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, p: 3 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', mb: 3 }}>{editId ? 'Edit Parish/Branch' : 'Add Parish / Branch'}</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField fullWidth label="Name *" value={form.name} onChange={set('name')} size="small" />
          <TextField fullWidth label="Address" value={form.address} onChange={set('address')} size="small" />
          <TextField fullWidth label="City / Town" value={form.city} onChange={set('city')} size="small" />
          <TextField fullWidth label="Phone" value={form.phone} onChange={set('phone')} size="small" />
          <TextField fullWidth label="Email" type="email" value={form.email} onChange={set('email')} size="small" />
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button variant="outlined" fullWidth onClick={() => setDrawerOpen(false)}>Cancel</Button>
          <Button variant="contained" fullWidth onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.name}>
            {saveMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Save'}
          </Button>
        </Box>
      </Drawer>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Parish</DialogTitle>
        <DialogContent><Typography>Delete <strong>{selected?.name}</strong>? Members assigned to this branch will be unassigned.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => deleteMutation.mutate(selected?.id)} disabled={deleteMutation.isPending}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
