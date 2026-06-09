import React, { useState } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, TextField, Button,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Chip, Avatar, Divider, Drawer,
} from '@mui/material';
import { Add, Edit, Delete, GroupWork, People } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useSnackbar } from 'notistack';

const MINISTRY_COLORS = ['#1a237e', '#6a1b9a', '#2e7d32', '#b71c1c', '#e65100', '#0277bd', '#558b2f', '#37474f'];
const emptyForm = { name: '', description: '' };

export default function Ministries() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['ministries'],
    queryFn: () => api.get('/tenant/ministries').then((r) => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (body: typeof form) => editId ? api.put(`/tenant/ministries/${editId}`, body) : api.post('/tenant/ministries', body),
    onSuccess: () => {
      enqueueSnackbar(editId ? 'Ministry updated' : 'Ministry created', { variant: 'success' });
      setDrawerOpen(false); setForm(emptyForm); setEditId(null);
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
    },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Failed', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tenant/ministries/${id}`),
    onSuccess: () => { enqueueSnackbar('Ministry deleted', { variant: 'success' }); setDeleteDialog(false); queryClient.invalidateQueries({ queryKey: ['ministries'] }); },
    onError: () => enqueueSnackbar('Delete failed', { variant: 'error' }),
  });

  const ministries = data || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e' }}>Ministries</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>{ministries.length} active ministries</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm(emptyForm); setEditId(null); setDrawerOpen(true); }}>
          Add Ministry
        </Button>
      </Box>

      {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}><CircularProgress /></Box> : (
        ministries.length === 0 ? (
          <Card><CardContent sx={{ py: 8, textAlign: 'center' }}>
            <GroupWork sx={{ fontSize: 56, color: 'rgba(26,35,126,0.2)', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#1a237e', mb: 1 }}>No Ministries Yet</Typography>
            <Typography sx={{ color: 'text.secondary', mb: 3 }}>Create ministries to organize your congregation.</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => setDrawerOpen(true)}>Create First Ministry</Button>
          </CardContent></Card>
        ) : (
          <Grid container spacing={3}>
            {ministries.map((m: any, idx: number) => {
              const color = MINISTRY_COLORS[idx % MINISTRY_COLORS.length];
              return (
                <Grid item xs={12} sm={6} md={4} key={m.id}>
                  <Card sx={{ transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-3px)' }, borderLeft: `4px solid ${color}` }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ bgcolor: color, width: 44, height: 44 }}>
                            <GroupWork />
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>{m.name}</Typography>
                            <Chip
                              label={`${m._count?.members || 0} members`}
                              size="small"
                              icon={<People sx={{ fontSize: '12px !important' }} />}
                              sx={{ bgcolor: `${color}15`, color, fontSize: '0.7rem', mt: 0.3 }}
                            />
                          </Box>
                        </Box>
                        <Box>
                          <IconButton size="small" onClick={() => { setForm({ name: m.name, description: m.description || '' }); setEditId(m.id); setDrawerOpen(true); }}><Edit fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => { setSelected(m); setDeleteDialog(true); }} color="error"><Delete fontSize="small" /></IconButton>
                        </Box>
                      </Box>
                      {m.description && <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', lineHeight: 1.6 }}>{m.description}</Typography>}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )
      )}

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, p: 3 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', mb: 3 }}>{editId ? 'Edit Ministry' : 'Create Ministry'}</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField fullWidth label="Ministry Name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} size="small" />
          <TextField fullWidth label="Description" multiline rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} size="small" />
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button variant="outlined" fullWidth onClick={() => setDrawerOpen(false)}>Cancel</Button>
          <Button variant="contained" fullWidth onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.name}>
            {saveMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Save'}
          </Button>
        </Box>
      </Drawer>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Ministry</DialogTitle>
        <DialogContent><Typography>Delete <strong>{selected?.name}</strong>?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => deleteMutation.mutate(selected?.id)} disabled={deleteMutation.isPending}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
