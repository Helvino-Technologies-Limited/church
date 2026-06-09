import React, { useState } from 'react';
import {
  Box, Card, Typography, TextField, InputAdornment, Button, Table,
  TableBody, TableCell, TableHead, TableRow, Chip, Avatar, IconButton,
  Menu, MenuItem, ListItemIcon, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, CircularProgress, Tooltip, Select, FormControl,
  InputLabel, Pagination, Drawer,
} from '@mui/material';
import {
  Search, MoreVert, Edit, Delete, Visibility, PersonAdd,
  Phone, Email, CheckCircle, Block,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useSnackbar } from 'notistack';

const STATUS_COLOR: Record<string, string> = { ACTIVE: '#2e7d32', INACTIVE: '#757575', TRANSFERRED: '#1565c0', DECEASED: '#616161' };

const emptyForm = {
  fullname: '', email: '', phone: '', gender: '', dateOfBirth: '',
  maritalStatus: '', address: '', city: '', occupation: '', employer: '',
  parishId: '', ministryId: '', notes: '',
};

export default function Members() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [viewDrawer, setViewDrawer] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: parishData } = useQuery({ queryKey: ['parishes'], queryFn: () => api.get('/tenant/parishes').then((r) => r.data.data) });
  const { data: ministryData } = useQuery({ queryKey: ['ministries-list'], queryFn: () => api.get('/tenant/parishes').then((r) => r.data.data) });

  const { data, isLoading } = useQuery({
    queryKey: ['members', page, search, statusFilter],
    queryFn: () => api.get(`/tenant/members?page=${page}&limit=15&search=${search}&status=${statusFilter}`).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof form) => editId ? api.put(`/tenant/members/${editId}`, body) : api.post('/tenant/members', body),
    onSuccess: () => {
      enqueueSnackbar(editId ? 'Member updated' : 'Member added successfully', { variant: 'success' });
      setDrawerOpen(false); setForm(emptyForm); setEditId(null);
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Failed', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tenant/members/${id}`),
    onSuccess: () => {
      enqueueSnackbar('Member deleted', { variant: 'success' });
      setDeleteDialog(false);
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
    onError: () => enqueueSnackbar('Delete failed', { variant: 'error' }),
  });

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [f]: e.target.value }));

  const handleEdit = (m: any) => {
    setForm({
      fullname: m.fullname || '', email: m.email || '', phone: m.phone || '',
      gender: m.gender || '', dateOfBirth: m.dateOfBirth ? m.dateOfBirth.split('T')[0] : '',
      maritalStatus: m.maritalStatus || '', address: m.address || '', city: m.city || '',
      occupation: m.occupation || '', employer: m.employer || '',
      parishId: m.parishId || '', ministryId: m.ministryId || '', notes: m.notes || '',
    });
    setEditId(m.id);
    setDrawerOpen(true);
    setAnchorEl(null);
  };

  const members = data?.data || [];
  const pagination = data?.pagination;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e' }}>Members</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>{pagination?.total || 0} registered members</Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAdd />} onClick={() => { setForm(emptyForm); setEditId(null); setDrawerOpen(true); }}>
          Add Member
        </Button>
      </Box>

      <Card sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search by name, member no, phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            size="small"
            sx={{ flex: 1, minWidth: 220 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <MenuItem value="">All</MenuItem>
              {['ACTIVE', 'INACTIVE', 'TRANSFERRED', 'DECEASED'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Card>

      <Card>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
        ) : (
          <>
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8f9ff' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Member</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Parish</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Gender</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Joined</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        No members found. Click "Add Member" to get started.
                      </TableCell>
                    </TableRow>
                  ) : members.map((m: any) => (
                    <TableRow key={m.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 34, height: 34, bgcolor: '#1a237e', fontSize: '0.8rem', fontWeight: 700 }}>
                            {m.fullname.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{m.fullname}</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{m.memberNo}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.82rem' }}>{m.phone || '-'}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{m.email || '-'}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{m.parish?.name || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{m.gender || '-'}</TableCell>
                      <TableCell>
                        <Chip label={m.status} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', bgcolor: `${STATUS_COLOR[m.status]}15`, color: STATUS_COLOR[m.status] }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{new Date(m.joinedAt).toLocaleDateString()}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedMember(m); }}>
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>

            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                Showing {members.length} of {pagination?.total || 0}
              </Typography>
              <Pagination count={pagination?.totalPages || 1} page={page} onChange={(_, v) => setPage(v)} size="small" color="primary" />
            </Box>
          </>
        )}
      </Card>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { setViewDrawer(true); setAnchorEl(null); }}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>View Details
        </MenuItem>
        <MenuItem onClick={() => handleEdit(selectedMember)}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>Edit
        </MenuItem>
        <MenuItem onClick={() => { setDeleteDialog(true); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>Delete
        </MenuItem>
      </Menu>

      {/* Add/Edit Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, p: 3 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', mb: 3 }}>
          {editId ? 'Edit Member' : 'Add New Member'}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}><TextField fullWidth label="Full Name *" value={form.fullname} onChange={set('fullname')} size="small" /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Email" type="email" value={form.email} onChange={set('email')} size="small" /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Phone" value={form.phone} onChange={set('phone')} size="small" /></Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Gender</InputLabel>
              <Select value={form.gender} label="Gender" onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}>
                <MenuItem value="">Select</MenuItem>
                {['MALE', 'FEMALE'].map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Marital Status</InputLabel>
              <Select value={form.maritalStatus} label="Marital Status" onChange={(e) => setForm((f) => ({ ...f, maritalStatus: e.target.value }))}>
                <MenuItem value="">Select</MenuItem>
                {['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Date of Birth" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} size="small" InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="City" value={form.city} onChange={set('city')} size="small" /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Address" value={form.address} onChange={set('address')} size="small" /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Occupation" value={form.occupation} onChange={set('occupation')} size="small" /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Employer" value={form.employer} onChange={set('employer')} size="small" /></Grid>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Parish / Branch</InputLabel>
              <Select value={form.parishId} label="Parish / Branch" onChange={(e) => setForm((f) => ({ ...f, parishId: e.target.value }))}>
                <MenuItem value="">None</MenuItem>
                {(parishData || []).map((p: any) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}><TextField fullWidth label="Notes" multiline rows={2} value={form.notes} onChange={set('notes')} size="small" /></Grid>
        </Grid>
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button variant="outlined" fullWidth onClick={() => setDrawerOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            fullWidth
            onClick={() => createMutation.mutate(form)}
            disabled={createMutation.isPending || !form.fullname}
          >
            {createMutation.isPending ? <CircularProgress size={20} color="inherit" /> : (editId ? 'Update' : 'Add Member')}
          </Button>
        </Box>
      </Drawer>

      {/* Delete Confirm */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Member</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <strong>{selectedMember?.fullname}</strong>? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => deleteMutation.mutate(selectedMember?.id)} disabled={deleteMutation.isPending}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
