import React, { useState } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, TextField, InputAdornment,
  Button, Table, TableBody, TableCell, TableHead, TableRow, Chip,
  IconButton, Menu, MenuItem, ListItemIcon, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Pagination,
  FormControl, InputLabel, Select, Drawer,
} from '@mui/material';
import { Search, MoreVert, Edit, Delete, Add, Inventory, AttachMoney, Category } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import { useSnackbar } from 'notistack';

const CATEGORIES = ['Land & Buildings', 'Vehicle', 'Equipment', 'Musical Instrument', 'Furniture', 'Electronics', 'Other'];
const CONDITIONS = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'NEEDS_REPAIR'];
const COLORS = ['#1a237e', '#c8a415', '#2e7d32', '#b71c1c', '#6a1b9a', '#0277bd', '#558b2f'];
const emptyForm = { assetName: '', assetCode: '', category: '', description: '', assetValue: '', location: '', status: 'ACTIVE', condition: 'GOOD', purchasedAt: '' };

export default function Assets() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selected, setSelected] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['assets', page, search],
    queryFn: () => api.get(`/tenant/assets?page=${page}&limit=15&search=${search}`).then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (body: typeof form) => editId
      ? api.put(`/tenant/assets/${editId}`, { ...body, assetValue: body.assetValue ? Number(body.assetValue) : undefined })
      : api.post('/tenant/assets', { ...body, assetValue: body.assetValue ? Number(body.assetValue) : undefined }),
    onSuccess: () => {
      enqueueSnackbar(editId ? 'Asset updated' : 'Asset added', { variant: 'success' });
      setDrawerOpen(false); setForm(emptyForm); setEditId(null);
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Failed', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tenant/assets/${id}`),
    onSuccess: () => { enqueueSnackbar('Asset deleted', { variant: 'success' }); setDeleteDialog(false); queryClient.invalidateQueries({ queryKey: ['assets'] }); },
    onError: () => enqueueSnackbar('Delete failed', { variant: 'error' }),
  });

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleEdit = (a: any) => {
    setForm({ assetName: a.assetName || '', assetCode: a.assetCode || '', category: a.category || '', description: a.description || '', assetValue: a.assetValue ? String(a.assetValue) : '', location: a.location || '', status: a.status || 'ACTIVE', condition: a.condition || 'GOOD', purchasedAt: a.purchasedAt ? a.purchasedAt.split('T')[0] : '' });
    setEditId(a.id); setDrawerOpen(true); setAnchorEl(null);
  };

  const assets = data?.data || [];
  const totalValue = data?.summary?.totalValue || 0;
  const pagination = data?.pagination;

  // Group by category for chart
  const byCategory: Record<string, number> = {};
  assets.forEach((a: any) => { const c = a.category || 'Other'; byCategory[c] = (byCategory[c] || 0) + Number(a.assetValue || 0); });
  const chartData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e' }}>Asset Register</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>{pagination?.total || 0} assets tracked</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm(emptyForm); setEditId(null); setDrawerOpen(true); }}>Add Asset</Button>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card><CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', fontWeight: 600 }}>TOTAL ASSETS</Typography>
              <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: 'rgba(26,35,126,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a237e' }}><Inventory /></Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a237e' }}>{pagination?.total || 0}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card><CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', fontWeight: 600 }}>TOTAL VALUE</Typography>
              <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: 'rgba(46,125,50,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2e7d32' }}><AttachMoney /></Box>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e' }}>KES {Number(totalValue).toLocaleString()}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card><CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', fontWeight: 600 }}>CATEGORIES</Typography>
              <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: 'rgba(106,27,154,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6a1b9a' }}><Category /></Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a237e' }}>{Object.keys(byCategory).length}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      {chartData.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontWeight: 700, mb: 2 }}>Value by Category</Typography>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" outerRadius={70} paddingAngle={3} dataKey="value">
                      {chartData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <RTooltip formatter={(v: number) => [`KES ${Number(v).toLocaleString()}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Card>
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <TextField placeholder="Search assets..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} size="small" sx={{ width: 280 }} InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }} />
        </Box>

        {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box> : (
          <>
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8f9ff' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Asset</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Condition</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Value</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assets.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>No assets registered yet.</TableCell></TableRow>
                  ) : assets.map((a: any) => (
                    <TableRow key={a.id} hover>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{a.assetName}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontFamily: 'monospace' }}>{a.assetCode}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{a.category || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{a.location || '-'}</TableCell>
                      <TableCell>
                        <Chip label={a.condition || 'GOOD'} size="small" sx={{ fontSize: '0.7rem', bgcolor: a.condition === 'EXCELLENT' || a.condition === 'GOOD' ? 'rgba(46,125,50,0.1)' : 'rgba(230,81,0,0.1)', color: a.condition === 'EXCELLENT' || a.condition === 'GOOD' ? '#2e7d32' : '#e65100' }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a237e' }}>{a.assetValue ? `KES ${Number(a.assetValue).toLocaleString()}` : '-'}</TableCell>
                      <TableCell><Chip label={a.status} size="small" sx={{ fontSize: '0.7rem', bgcolor: a.status === 'ACTIVE' ? 'rgba(46,125,50,0.1)' : 'rgba(0,0,0,0.05)', color: a.status === 'ACTIVE' ? '#2e7d32' : 'text.secondary' }} /></TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={(ev) => { setAnchorEl(ev.currentTarget); setSelected(a); }}>
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>Showing {assets.length} of {pagination?.total || 0}</Typography>
              <Pagination count={pagination?.totalPages || 1} page={page} onChange={(_, v) => setPage(v)} size="small" color="primary" />
            </Box>
          </>
        )}
      </Card>

      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => handleEdit(selected)}><ListItemIcon><Edit fontSize="small" /></ListItemIcon>Edit</MenuItem>
        <MenuItem onClick={() => { setDeleteDialog(true); setAnchorEl(null); }} sx={{ color: 'error.main' }}><ListItemIcon><Delete fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>Delete</MenuItem>
      </Menu>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 440 }, p: 3 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', mb: 3 }}>{editId ? 'Edit Asset' : 'Register Asset'}</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}><TextField fullWidth label="Asset Name *" value={form.assetName} onChange={set('assetName')} size="small" /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Asset Code" value={form.assetCode} onChange={set('assetCode')} size="small" placeholder="Auto-generated" /></Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select value={form.category} label="Category" onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}><TextField fullWidth label="Description" multiline rows={2} value={form.description} onChange={set('description')} size="small" /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Value (KES)" type="number" value={form.assetValue} onChange={set('assetValue')} size="small" /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Location" value={form.location} onChange={set('location')} size="small" /></Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Condition</InputLabel>
              <Select value={form.condition} label="Condition" onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}>
                {CONDITIONS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Purchase Date" type="date" value={form.purchasedAt} onChange={set('purchasedAt')} size="small" InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={form.status} label="Status" onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                {['ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE', 'DISPOSED'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button variant="outlined" fullWidth onClick={() => setDrawerOpen(false)}>Cancel</Button>
          <Button variant="contained" fullWidth onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.assetName}>
            {saveMutation.isPending ? <CircularProgress size={20} color="inherit" /> : (editId ? 'Update' : 'Register')}
          </Button>
        </Box>
      </Drawer>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Asset</DialogTitle>
        <DialogContent><Typography>Delete <strong>{selected?.assetName}</strong> from the asset register?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => deleteMutation.mutate(selected?.id)} disabled={deleteMutation.isPending}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
