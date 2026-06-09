import React, { useState } from 'react';
import {
  Box, Card, Typography, Button, Grid, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, CircularProgress,
  LinearProgress, Tooltip, Alert,
} from '@mui/material';
import { Add, Edit, Delete, Savings } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useSnackbar } from 'notistack';

const PRESET_COLORS = ['#1a237e', '#2e7d32', '#b71c1c', '#e65100', '#6a1b9a', '#00695c', '#0277bd', '#558b2f'];

const emptyForm = { name: '', description: '', color: '#1a237e', targetAmount: '' };

export default function FundCategories() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['fund-categories'],
    queryFn: () => api.get('/tenant/fund-categories').then((r) => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (body: any) => editId ? api.put(`/tenant/fund-categories/${editId}`, body) : api.post('/tenant/fund-categories', body),
    onSuccess: () => {
      enqueueSnackbar(editId ? 'Fund updated' : 'Fund category created', { variant: 'success' });
      setDialogOpen(false); setForm(emptyForm); setEditId(null);
      qc.invalidateQueries({ queryKey: ['fund-categories'] });
    },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Failed', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tenant/fund-categories/${id}`),
    onSuccess: () => {
      enqueueSnackbar('Fund category deleted', { variant: 'success' });
      setDeleteDialog(false);
      qc.invalidateQueries({ queryKey: ['fund-categories'] });
    },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Cannot delete', { variant: 'error' }),
  });

  const handleEdit = (c: any) => {
    setForm({ name: c.name, description: c.description || '', color: c.color || '#1a237e', targetAmount: c.targetAmount ? String(c.targetAmount) : '' });
    setEditId(c.id); setDialogOpen(true);
  };

  const handleSubmit = () => {
    const body: any = { name: form.name, description: form.description, color: form.color };
    if (form.targetAmount) body.targetAmount = parseFloat(form.targetAmount);
    saveMutation.mutate(body);
  };

  const categories: any[] = data || [];
  const totalRaised = categories.reduce((s, c) => s + (c.totalRaised || 0), 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e' }}>Fund Categories</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
            Manage how donations are categorised — e.g. Welfare, Funeral, Building Fund
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm(emptyForm); setEditId(null); setDialogOpen(true); }}>
          Add Fund
        </Button>
      </Box>

      {/* Summary */}
      <Card sx={{ mb: 3, p: 2.5, background: 'linear-gradient(135deg,#1a237e,#283593)', color: 'white', borderRadius: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Typography sx={{ opacity: 0.8, fontSize: '0.85rem' }}>Total Funds</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: '2rem' }}>{categories.length}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography sx={{ opacity: 0.8, fontSize: '0.85rem' }}>Total Raised Across Funds</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: '2rem' }}>KES {totalRaised.toLocaleString()}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography sx={{ opacity: 0.8, fontSize: '0.85rem' }}>Active Funds</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: '2rem' }}>{categories.filter((c) => c.isActive).length}</Typography>
          </Grid>
        </Grid>
      </Card>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
      ) : categories.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <Savings sx={{ fontSize: 60, color: '#bbb', mb: 2 }} />
          <Typography sx={{ color: 'text.secondary', mb: 2 }}>No fund categories yet.</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mb: 3 }}>
            Create categories like "Welfare Fund", "Funeral Fund", "Building Fund" to organise donations.
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => { setForm(emptyForm); setEditId(null); setDialogOpen(true); }}>
            Create First Fund
          </Button>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {categories.map((c: any) => {
            const progress = c.targetAmount ? Math.min((c.totalRaised / Number(c.targetAmount)) * 100, 100) : null;
            return (
              <Grid item xs={12} sm={6} md={4} key={c.id}>
                <Card sx={{ p: 2.5, borderLeft: `5px solid ${c.color || '#1a237e'}`, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-3px)', boxShadow: 4 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: c.color || '#1a237e' }}>{c.name}</Typography>
                      {!c.isActive && <Chip label="Inactive" size="small" sx={{ fontSize: '0.65rem', mt: 0.5 }} />}
                    </Box>
                    <Box>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(c)}><Edit fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title={c.donationCount > 0 ? 'Has donations — cannot delete' : 'Delete'}>
                        <span>
                          <IconButton size="small" color="error" disabled={c.donationCount > 0}
                            onClick={() => { setSelected(c); setDeleteDialog(true); }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>

                  {c.description && (
                    <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mb: 1.5 }}>{c.description}</Typography>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: progress !== null ? 1 : 0 }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Total Raised</Typography>
                      <Typography sx={{ fontWeight: 700, color: c.color || '#1a237e', fontSize: '1.1rem' }}>
                        KES {(c.totalRaised || 0).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Donations</Typography>
                      <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>{c.donationCount || 0}</Typography>
                    </Box>
                  </Box>

                  {progress !== null && (
                    <>
                      <LinearProgress variant="determinate" value={progress}
                        sx={{ height: 6, borderRadius: 3, bgcolor: `${c.color}22`, '& .MuiLinearProgress-bar': { bgcolor: c.color } }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                          Target: KES {Number(c.targetAmount).toLocaleString()}
                        </Typography>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: c.color }}>{Math.round(progress)}%</Typography>
                      </Box>
                    </>
                  )}
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#1a237e' }}>{editId ? 'Edit Fund Category' : 'New Fund Category'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Fund Name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                size="small" placeholder="e.g. Welfare Fund, Funeral Fund, Building Fund" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                size="small" multiline rows={2} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Target Amount (KES, optional)" type="number" value={form.targetAmount}
                onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))} size="small"
                placeholder="Leave blank for no target" />
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontSize: '0.85rem', mb: 1, color: 'text.secondary' }}>Fund Color</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {PRESET_COLORS.map((col) => (
                  <Box key={col} onClick={() => setForm((f) => ({ ...f, color: col }))}
                    sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: col, cursor: 'pointer',
                      border: form.color === col ? '3px solid #333' : '3px solid transparent',
                      transition: 'transform 0.15s', '&:hover': { transform: 'scale(1.15)' } }} />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saveMutation.isPending || !form.name}>
            {saveMutation.isPending ? <CircularProgress size={18} color="inherit" /> : (editId ? 'Update' : 'Create Fund')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Fund Category</DialogTitle>
        <DialogContent>
          <Typography>Delete <strong>{selected?.name}</strong>? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => deleteMutation.mutate(selected?.id)} disabled={deleteMutation.isPending}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
