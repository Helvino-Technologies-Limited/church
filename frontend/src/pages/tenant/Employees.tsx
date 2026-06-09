import React, { useState } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, TextField, InputAdornment,
  Button, Table, TableBody, TableCell, TableHead, TableRow, Chip,
  IconButton, Menu, MenuItem, ListItemIcon, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Pagination,
  FormControl, InputLabel, Select, Drawer, Avatar,
} from '@mui/material';
import { Search, MoreVert, Edit, Delete, Add, Work, Person, AttachMoney } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useSnackbar } from 'notistack';

const DEPARTMENTS = ['Pastoral', 'Administration', 'Finance', 'Worship', 'Youth', 'Children', 'Maintenance', 'Security', 'Media', 'Outreach'];
const emptyForm = { fullname: '', email: '', phone: '', department: '', position: '', salary: '', startDate: '', status: 'ACTIVE', notes: '' };

export default function Employees() {
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
    queryKey: ['employees', page, search],
    queryFn: () => api.get(`/tenant/employees?page=${page}&limit=15&search=${search}`).then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (body: typeof form) => editId
      ? api.put(`/tenant/employees/${editId}`, { ...body, salary: body.salary ? Number(body.salary) : undefined })
      : api.post('/tenant/employees', { ...body, salary: body.salary ? Number(body.salary) : undefined }),
    onSuccess: () => {
      enqueueSnackbar(editId ? 'Employee updated' : 'Employee added', { variant: 'success' });
      setDrawerOpen(false); setForm(emptyForm); setEditId(null);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Failed', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tenant/employees/${id}`),
    onSuccess: () => {
      enqueueSnackbar('Employee removed', { variant: 'success' });
      setDeleteDialog(false);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: () => enqueueSnackbar('Delete failed', { variant: 'error' }),
  });

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleEdit = (emp: any) => {
    setForm({ fullname: emp.fullname || '', email: emp.email || '', phone: emp.phone || '', department: emp.department || '', position: emp.position || '', salary: emp.salary ? String(emp.salary) : '', startDate: emp.startDate ? emp.startDate.split('T')[0] : '', status: emp.status || 'ACTIVE', notes: emp.notes || '' });
    setEditId(emp.id); setDrawerOpen(true); setAnchorEl(null);
  };

  const employees = data?.data || [];
  const pagination = data?.pagination;

  // Stats
  const departments = [...new Set(employees.map((e: any) => e.department).filter(Boolean))];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e' }}>Employees & Staff</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>{pagination?.total || 0} staff members</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm(emptyForm); setEditId(null); setDrawerOpen(true); }}>Add Employee</Button>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'Total Staff', value: pagination?.total || 0, icon: <Person />, color: '#1a237e' },
          { label: 'Departments', value: departments.length, icon: <Work />, color: '#6a1b9a' },
          { label: 'Active', value: employees.filter((e: any) => e.status === 'ACTIVE').length, icon: <Work />, color: '#2e7d32' },
        ].map((s) => (
          <Grid item xs={12} sm={4} key={s.label}>
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', fontWeight: 600 }}>{s.label}</Typography>
                  <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a237e' }}>{s.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <TextField placeholder="Search employees..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} size="small" sx={{ width: 280 }} InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }} />
        </Box>

        {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box> : (
          <>
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8f9ff' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Position</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Salary</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>No employees added yet.</TableCell></TableRow>
                  ) : employees.map((e: any) => (
                    <TableRow key={e.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 34, height: 34, bgcolor: '#6a1b9a', fontSize: '0.8rem' }}>{e.fullname.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}</Avatar>
                          <Box>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{e.fullname}</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{e.employeeNo}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{e.department || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{e.position || '-'}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.82rem' }}>{e.phone || '-'}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{e.email || '-'}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#2e7d32' }}>{e.salary ? `KES ${Number(e.salary).toLocaleString()}` : '-'}</TableCell>
                      <TableCell><Chip label={e.status} size="small" sx={{ fontSize: '0.7rem', bgcolor: e.status === 'ACTIVE' ? 'rgba(46,125,50,0.1)' : 'rgba(0,0,0,0.05)', color: e.status === 'ACTIVE' ? '#2e7d32' : 'text.secondary' }} /></TableCell>
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
              <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>Showing {employees.length} of {pagination?.total || 0}</Typography>
              <Pagination count={pagination?.totalPages || 1} page={page} onChange={(_, v) => setPage(v)} size="small" color="primary" />
            </Box>
          </>
        )}
      </Card>

      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => handleEdit(selected)}><ListItemIcon><Edit fontSize="small" /></ListItemIcon>Edit</MenuItem>
        <MenuItem onClick={() => { setDeleteDialog(true); setAnchorEl(null); }} sx={{ color: 'error.main' }}><ListItemIcon><Delete fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>Delete</MenuItem>
      </Menu>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 460 }, p: 3 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', mb: 3 }}>{editId ? 'Edit Employee' : 'Add Employee'}</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}><TextField fullWidth label="Full Name *" value={form.fullname} onChange={set('fullname')} size="small" /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Phone" value={form.phone} onChange={set('phone')} size="small" /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Email" type="email" value={form.email} onChange={set('email')} size="small" /></Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Department</InputLabel>
              <Select value={form.department} label="Department" onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}>
                <MenuItem value="">Select</MenuItem>
                {DEPARTMENTS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Position / Title" value={form.position} onChange={set('position')} size="small" /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Basic Salary (KES)" type="number" value={form.salary} onChange={set('salary')} size="small" /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Start Date" type="date" value={form.startDate} onChange={set('startDate')} size="small" InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={form.status} label="Status" onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                {['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}><TextField fullWidth label="Notes" multiline rows={2} value={form.notes} onChange={set('notes')} size="small" /></Grid>
        </Grid>
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button variant="outlined" fullWidth onClick={() => setDrawerOpen(false)}>Cancel</Button>
          <Button variant="contained" fullWidth onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.fullname}>
            {saveMutation.isPending ? <CircularProgress size={20} color="inherit" /> : (editId ? 'Update' : 'Add Employee')}
          </Button>
        </Box>
      </Drawer>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove Employee</DialogTitle>
        <DialogContent><Typography>Remove <strong>{selected?.fullname}</strong> from staff?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => deleteMutation.mutate(selected?.id)} disabled={deleteMutation.isPending}>Remove</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
