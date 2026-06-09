import React, { useState } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, TextField, Button,
  Table, TableBody, TableCell, TableHead, TableRow, Chip,
  IconButton, Menu, MenuItem, ListItemIcon, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Pagination,
  FormControl, InputLabel, Select, Drawer,
} from '@mui/material';
import { Add, Edit, Delete, MoreVert, People, Wc, Diversity3, PersonAdd } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import { useSnackbar } from 'notistack';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SERVICE_TYPES = ['Sunday Service', 'Wednesday Service', 'Friday Service', 'Youth Service', 'Children Church', 'Special Service', 'Prayer Meeting', 'Vigil', 'Other'];
const emptyForm = { serviceDate: '', serviceType: 'Sunday Service', adults: '', children: '', visitors: '', notes: '' };

export default function Attendance() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [page, setPage] = useState(1);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selected, setSelected] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  const year = new Date().getFullYear();

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', page],
    queryFn: () => api.get(`/tenant/attendance?page=${page}&limit=15`).then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (body: typeof form) => {
      const payload = {
        date: body.serviceDate,
        serviceType: body.serviceType,
        adults: Number(body.adults) || 0,
        children: Number(body.children) || 0,
        visitors: Number(body.visitors) || 0,
        notes: body.notes,
      };
      return editId ? api.put(`/tenant/attendance/${editId}`, payload) : api.post('/tenant/attendance', payload);
    },
    onSuccess: () => {
      enqueueSnackbar(editId ? 'Attendance updated' : 'Attendance recorded', { variant: 'success' });
      setDrawerOpen(false); setForm(emptyForm); setEditId(null);
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Failed', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tenant/attendance/${id}`),
    onSuccess: () => { enqueueSnackbar('Record deleted', { variant: 'success' }); setDeleteDialog(false); queryClient.invalidateQueries({ queryKey: ['attendance'] }); },
    onError: () => enqueueSnackbar('Delete failed', { variant: 'error' }),
  });

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleEdit = (a: any) => {
    setForm({ serviceDate: a.date ? a.date.split('T')[0] : '', serviceType: a.serviceType || 'Sunday Service', adults: String(a.adults || ''), children: String(a.children || ''), visitors: String(a.visitors || ''), notes: a.notes || '' });
    setEditId(a.id); setDrawerOpen(true); setAnchorEl(null);
  };

  const records = data?.data || [];
  const pagination = data?.pagination;
  const summary = data?.summary || {};

  const totalAdults = records.reduce((s: number, r: any) => s + (r.adults || 0), 0);
  const totalChildren = records.reduce((s: number, r: any) => s + (r.children || 0), 0);
  const totalVisitors = records.reduce((s: number, r: any) => s + (r.visitors || 0), 0);
  const avgTotal = records.length > 0 ? Math.round(records.reduce((s: number, r: any) => s + (r.total || 0), 0) / records.length) : 0;

  // Monthly trend from current page data
  const monthlyData = MONTHS.map((month, i) => {
    const monthRecords = records.filter((r: any) => {
      const d = new Date(r.date);
      return d.getMonth() === i && d.getFullYear() === year;
    });
    return { month, total: monthRecords.reduce((s: number, r: any) => s + (r.total || 0), 0) };
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e' }}>Attendance</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>{pagination?.total || 0} service records</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({ ...emptyForm, serviceDate: new Date().toISOString().split('T')[0] }); setEditId(null); setDrawerOpen(true); }}>
          Record Attendance
        </Button>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'AVG ATTENDANCE', value: avgTotal, icon: <People />, color: '#1a237e' },
          { label: 'TOTAL ADULTS', value: totalAdults, icon: <Wc />, color: '#2e7d32' },
          { label: 'TOTAL CHILDREN', value: totalChildren, icon: <Diversity3 />, color: '#c8a415' },
          { label: 'TOTAL VISITORS', value: totalVisitors, icon: <PersonAdd />, color: '#6a1b9a' },
        ].map((s) => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Card sx={{ borderLeft: `4px solid ${s.color}` }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem', fontWeight: 600 }}>{s.label}</Typography>
                  <Box sx={{ width: 34, height: 34, borderRadius: 1.5, bgcolor: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</Box>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: s.color }}>{s.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {monthlyData.some((d) => d.total > 0) && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography sx={{ fontWeight: 700, mb: 2 }}>Monthly Attendance Trend ({year})</Typography>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip formatter={(v: number) => [v, 'Total']} />
                <Bar dataKey="total" fill="#1a237e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box> : (
          <>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8f9ff' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Service Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Adults</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Children</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Visitors</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Total</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Notes</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>No attendance records. Start recording services.</TableCell></TableRow>
                  ) : records.map((r: any) => (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{new Date(r.date).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
                      <TableCell><Chip label={r.serviceType || 'Sunday Service'} size="small" sx={{ fontSize: '0.72rem', bgcolor: 'rgba(26,35,126,0.07)', color: '#1a237e' }} /></TableCell>
                      <TableCell sx={{ textAlign: 'right', fontSize: '0.85rem' }}>{r.adults || 0}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontSize: '0.85rem' }}>{r.children || 0}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontSize: '0.85rem', color: '#6a1b9a' }}>{r.visitors || 0}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontSize: '0.85rem', fontWeight: 800, color: '#1a237e' }}>{r.total || 0}</TableCell>
                      <TableCell sx={{ fontSize: '0.78rem', color: 'text.secondary', maxWidth: 150 }}>{r.notes || '-'}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={(e) => { setAnchorEl(e.currentTarget); setSelected(r); }}><MoreVert fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>Showing {records.length} of {pagination?.total || 0}</Typography>
              <Pagination count={pagination?.totalPages || 1} page={page} onChange={(_, v) => setPage(v)} size="small" color="primary" />
            </Box>
          </>
        )}
      </Card>

      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => handleEdit(selected)}><ListItemIcon><Edit fontSize="small" /></ListItemIcon>Edit</MenuItem>
        <MenuItem onClick={() => { setDeleteDialog(true); setAnchorEl(null); }} sx={{ color: 'error.main' }}><ListItemIcon><Delete fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>Delete</MenuItem>
      </Menu>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, p: 3 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', mb: 3 }}>{editId ? 'Edit Record' : 'Record Attendance'}</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}><TextField fullWidth label="Service Date *" type="date" value={form.serviceDate} onChange={set('serviceDate')} size="small" InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Service Type</InputLabel>
              <Select value={form.serviceType} label="Service Type" onChange={(e) => setForm((f) => ({ ...f, serviceType: e.target.value }))}>
                {SERVICE_TYPES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={4}><TextField fullWidth label="Adults" type="number" value={form.adults} onChange={set('adults')} size="small" inputProps={{ min: 0 }} /></Grid>
          <Grid item xs={4}><TextField fullWidth label="Children" type="number" value={form.children} onChange={set('children')} size="small" inputProps={{ min: 0 }} /></Grid>
          <Grid item xs={4}><TextField fullWidth label="Visitors" type="number" value={form.visitors} onChange={set('visitors')} size="small" inputProps={{ min: 0 }} /></Grid>
          {(form.adults || form.children || form.visitors) && (
            <Grid item xs={12}>
              <Box sx={{ p: 1.5, bgcolor: 'rgba(26,35,126,0.05)', borderRadius: 2, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.85rem', color: '#1a237e', fontWeight: 700 }}>
                  Total: {(Number(form.adults) || 0) + (Number(form.children) || 0) + (Number(form.visitors) || 0)}
                </Typography>
              </Box>
            </Grid>
          )}
          <Grid item xs={12}><TextField fullWidth label="Notes" multiline rows={2} value={form.notes} onChange={set('notes')} size="small" /></Grid>
        </Grid>
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button variant="outlined" fullWidth onClick={() => setDrawerOpen(false)}>Cancel</Button>
          <Button variant="contained" fullWidth onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.serviceDate}>
            {saveMutation.isPending ? <CircularProgress size={20} color="inherit" /> : (editId ? 'Update' : 'Record')}
          </Button>
        </Box>
      </Drawer>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Record</DialogTitle>
        <DialogContent><Typography>Delete attendance record for <strong>{selected?.date ? new Date(selected.date).toLocaleDateString() : ''}</strong>?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => deleteMutation.mutate(selected?.id)} disabled={deleteMutation.isPending}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
