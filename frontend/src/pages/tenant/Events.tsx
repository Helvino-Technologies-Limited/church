import React, { useState } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, TextField, InputAdornment,
  Button, Table, TableBody, TableCell, TableHead, TableRow, Chip,
  IconButton, Menu, MenuItem, ListItemIcon, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Pagination,
  FormControl, InputLabel, Select, Drawer,
} from '@mui/material';
import { Search, MoreVert, Edit, Delete, Add, EventNote, Today, Upcoming } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useSnackbar } from 'notistack';

const CATEGORIES = ['Service', 'Conference', 'Meeting', 'Outreach', 'Prayer', 'Youth', 'Children', 'Fundraiser', 'Training', 'Wedding', 'Funeral', 'Other'];
const STATUS_COLOR: Record<string, string> = { UPCOMING: '#1565c0', ONGOING: '#2e7d32', COMPLETED: '#616161', CANCELLED: '#c62828' };
const emptyForm = { title: '', description: '', location: '', startDate: '', endDate: '', allDay: false, category: '', status: 'UPCOMING' };

export default function Events() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selected, setSelected] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['events', page, statusFilter],
    queryFn: () => api.get(`/tenant/events?page=${page}&limit=15&status=${statusFilter}`).then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (body: typeof form) => editId ? api.put(`/tenant/events/${editId}`, body) : api.post('/tenant/events', body),
    onSuccess: () => {
      enqueueSnackbar(editId ? 'Event updated' : 'Event created', { variant: 'success' });
      setDrawerOpen(false); setForm(emptyForm); setEditId(null);
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Failed', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tenant/events/${id}`),
    onSuccess: () => { enqueueSnackbar('Event deleted', { variant: 'success' }); setDeleteDialog(false); queryClient.invalidateQueries({ queryKey: ['events'] }); },
    onError: () => enqueueSnackbar('Delete failed', { variant: 'error' }),
  });

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleEdit = (ev: any) => {
    setForm({ title: ev.title || '', description: ev.description || '', location: ev.location || '', startDate: ev.startDate ? ev.startDate.split('T')[0] : '', endDate: ev.endDate ? ev.endDate.split('T')[0] : '', allDay: ev.allDay || false, category: ev.category || '', status: ev.status || 'UPCOMING' });
    setEditId(ev.id); setDrawerOpen(true); setAnchorEl(null);
  };

  const events = data?.data || [];
  const pagination = data?.pagination;
  const upcoming = events.filter((e: any) => e.status === 'UPCOMING').length;
  const ongoing = events.filter((e: any) => e.status === 'ONGOING').length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e' }}>Events & Calendar</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>{pagination?.total || 0} events scheduled</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm(emptyForm); setEditId(null); setDrawerOpen(true); }}>Create Event</Button>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'Total Events', value: pagination?.total || 0, icon: <EventNote />, color: '#1a237e' },
          { label: 'Upcoming', value: upcoming, icon: <Upcoming />, color: '#1565c0' },
          { label: 'Ongoing', value: ongoing, icon: <Today />, color: '#2e7d32' },
        ].map((s) => (
          <Grid item xs={12} sm={4} key={s.label}>
            <Card><CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', fontWeight: 600 }}>{s.label}</Typography>
                <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a237e' }}>{s.value}</Typography>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <MenuItem value="">All</MenuItem>
              {['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box> : (
          <>
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8f9ff' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Event</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Start Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>End Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {events.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>No events found.</TableCell></TableRow>
                  ) : events.map((e: any) => (
                    <TableRow key={e.id} hover>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{e.title}</Typography>
                        {e.description && <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{e.description.slice(0, 60)}{e.description.length > 60 ? '...' : ''}</Typography>}
                      </TableCell>
                      <TableCell><Chip label={e.category || 'General'} size="small" sx={{ fontSize: '0.72rem' }} /></TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{e.location || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem' }}>{new Date(e.startDate).toLocaleDateString()}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>{e.endDate ? new Date(e.endDate).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>
                        <Chip label={e.status} size="small" sx={{ fontSize: '0.7rem', bgcolor: `${STATUS_COLOR[e.status]}15`, color: STATUS_COLOR[e.status], fontWeight: 600 }} />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={(ev) => { setAnchorEl(ev.currentTarget); setSelected(e); }}>
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>Showing {events.length} of {pagination?.total || 0}</Typography>
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
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', mb: 3 }}>{editId ? 'Edit Event' : 'Create Event'}</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField fullWidth label="Event Title *" value={form.title} onChange={set('title')} size="small" />
          <TextField fullWidth label="Description" multiline rows={3} value={form.description} onChange={set('description')} size="small" />
          <TextField fullWidth label="Location" value={form.location} onChange={set('location')} size="small" />
          <Grid container spacing={2}>
            <Grid item xs={6}><TextField fullWidth label="Start Date *" type="date" value={form.startDate} onChange={set('startDate')} size="small" InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="End Date" type="date" value={form.endDate} onChange={set('endDate')} size="small" InputLabelProps={{ shrink: true }} /></Grid>
          </Grid>
          <FormControl fullWidth size="small">
            <InputLabel>Category</InputLabel>
            <Select value={form.category} label="Category" onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select value={form.status} label="Status" onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              {['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button variant="outlined" fullWidth onClick={() => setDrawerOpen(false)}>Cancel</Button>
          <Button variant="contained" fullWidth onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.title || !form.startDate}>
            {saveMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Save Event'}
          </Button>
        </Box>
      </Drawer>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent><Typography>Delete <strong>{selected?.title}</strong>?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => deleteMutation.mutate(selected?.id)} disabled={deleteMutation.isPending}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
