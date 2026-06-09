import React, { useState } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, TextField, Button,
  Table, TableBody, TableCell, TableHead, TableRow, Chip,
  IconButton, Menu, MenuItem, ListItemIcon, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Pagination,
  FormControl, InputLabel, Select, Drawer,
} from '@mui/material';
import { Add, Edit, Delete, MoreVert, Payment, Group, CheckCircle, AccessTime } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useSnackbar } from 'notistack';

const METHODS = ['CASH', 'MPESA', 'AIRTEL_MONEY', 'BANK_TRANSFER', 'CHEQUE'];
const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: 'rgba(200,164,21,0.12)', color: '#b87200' },
  APPROVED: { bg: 'rgba(26,35,126,0.1)', color: '#1a237e' },
  PAID: { bg: 'rgba(46,125,50,0.12)', color: '#2e7d32' },
  CANCELLED: { bg: 'rgba(198,40,40,0.1)', color: '#c62828' },
};
const emptyForm = { employeeId: '', periodStart: '', periodEnd: '', basicSalary: '', allowances: '', deductions: '', paymentMethod: 'BANK_TRANSFER', notes: '' };

export default function Payroll() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selected, setSelected] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['payroll', page, statusFilter],
    queryFn: () => api.get(`/tenant/payroll?page=${page}&limit=15&status=${statusFilter}`).then((r) => r.data),
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees-list'],
    queryFn: () => api.get('/tenant/employees?limit=100').then((r) => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (body: typeof form) => {
      const basic = Number(body.basicSalary) || 0;
      const allowances = Number(body.allowances) || 0;
      const deductions = Number(body.deductions) || 0;
      const payload = { ...body, basicSalary: basic, allowances, deductions, netPay: basic + allowances - deductions };
      return editId ? api.put(`/tenant/payroll/${editId}`, payload) : api.post('/tenant/payroll', payload);
    },
    onSuccess: () => {
      enqueueSnackbar(editId ? 'Payroll updated' : 'Payroll created', { variant: 'success' });
      setDrawerOpen(false); setForm(emptyForm); setEditId(null);
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
    },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Failed', { variant: 'error' }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/tenant/payroll/${id}/status`, { status }),
    onSuccess: () => { enqueueSnackbar('Status updated', { variant: 'success' }); setAnchorEl(null); queryClient.invalidateQueries({ queryKey: ['payroll'] }); },
    onError: () => enqueueSnackbar('Update failed', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tenant/payroll/${id}`),
    onSuccess: () => { enqueueSnackbar('Deleted', { variant: 'success' }); setDeleteDialog(false); queryClient.invalidateQueries({ queryKey: ['payroll'] }); },
    onError: () => enqueueSnackbar('Delete failed', { variant: 'error' }),
  });

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleEdit = (p: any) => {
    setForm({ employeeId: p.employeeId || '', periodStart: p.periodStart ? p.periodStart.split('T')[0] : '', periodEnd: p.periodEnd ? p.periodEnd.split('T')[0] : '', basicSalary: String(p.basicSalary || ''), allowances: String(p.allowances || ''), deductions: String(p.deductions || ''), paymentMethod: p.paymentMethod || 'BANK_TRANSFER', notes: p.notes || '' });
    setEditId(p.id); setDrawerOpen(true); setAnchorEl(null);
  };

  const records = data?.data || [];
  const pagination = data?.pagination;
  const employees = employeesData || [];

  const totalPaid = records.filter((r: any) => r.status === 'PAID').reduce((s: number, r: any) => s + Number(r.netPay || 0), 0);
  const pendingCount = records.filter((r: any) => r.status === 'PENDING').length;
  const approvedCount = records.filter((r: any) => r.status === 'APPROVED').length;

  const basicNum = Number(form.basicSalary) || 0;
  const allowancesNum = Number(form.allowances) || 0;
  const deductionsNum = Number(form.deductions) || 0;
  const netPreview = basicNum + allowancesNum - deductionsNum;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e' }}>Payroll</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>{pagination?.total || 0} payroll records</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm(emptyForm); setEditId(null); setDrawerOpen(true); }}>
          Create Payroll
        </Button>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'TOTAL PAID OUT', value: `KES ${totalPaid.toLocaleString()}`, icon: <Payment />, color: '#2e7d32' },
          { label: 'STAFF ON PAYROLL', value: pagination?.total || 0, icon: <Group />, color: '#1a237e' },
          { label: 'PENDING APPROVAL', value: pendingCount, icon: <AccessTime />, color: '#b87200' },
          { label: 'APPROVED', value: approvedCount, icon: <CheckCircle />, color: '#6a1b9a' },
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

      <Card>
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <MenuItem value="">All</MenuItem>
              {['PENDING', 'APPROVED', 'PAID', 'CANCELLED'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box> : (
          <>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8f9ff' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Period</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Basic</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Allowances</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Deductions</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Net Pay</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>No payroll records. Create payroll to get started.</TableCell></TableRow>
                  ) : records.map((r: any) => (
                    <TableRow key={r.id} hover>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{r.employee?.fullName || r.employee?.firstName || '-'}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{r.employee?.department || ''}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>
                        {r.periodStart ? new Date(r.periodStart).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '-'}
                        {r.periodEnd ? ` – ${new Date(r.periodEnd).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}` : ''}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', fontSize: '0.83rem' }}>{Number(r.basicSalary || 0).toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontSize: '0.83rem', color: '#2e7d32' }}>+{Number(r.allowances || 0).toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontSize: '0.83rem', color: '#c62828' }}>-{Number(r.deductions || 0).toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontWeight: 700, color: '#1a237e', fontSize: '0.88rem' }}>KES {Number(r.netPay || 0).toLocaleString()}</TableCell>
                      <TableCell sx={{ fontSize: '0.78rem' }}>{r.paymentMethod?.replace('_', ' ')}</TableCell>
                      <TableCell>
                        <Chip label={r.status} size="small" sx={{ fontSize: '0.7rem', bgcolor: STATUS_COLOR[r.status]?.bg || 'rgba(0,0,0,0.05)', color: STATUS_COLOR[r.status]?.color || 'text.secondary', fontWeight: 600 }} />
                      </TableCell>
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
        {selected?.status === 'PENDING' && <MenuItem onClick={() => statusMutation.mutate({ id: selected.id, status: 'APPROVED' })}><ListItemIcon><CheckCircle fontSize="small" /></ListItemIcon>Approve</MenuItem>}
        {selected?.status === 'APPROVED' && <MenuItem onClick={() => statusMutation.mutate({ id: selected.id, status: 'PAID' })}><ListItemIcon><Payment fontSize="small" /></ListItemIcon>Mark as Paid</MenuItem>}
        <MenuItem onClick={() => { setDeleteDialog(true); setAnchorEl(null); }} sx={{ color: 'error.main' }}><ListItemIcon><Delete fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>Delete</MenuItem>
      </Menu>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 440 }, p: 3 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', mb: 3 }}>{editId ? 'Edit Payroll' : 'Create Payroll'}</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Employee *</InputLabel>
              <Select value={form.employeeId} label="Employee *" onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}>
                {employees.map((e: any) => <MenuItem key={e.id} value={e.id}>{e.fullName || `${e.firstName} ${e.lastName}`} — {e.department}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}><TextField fullWidth label="Period Start *" type="date" value={form.periodStart} onChange={set('periodStart')} size="small" InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Period End *" type="date" value={form.periodEnd} onChange={set('periodEnd')} size="small" InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Basic Salary (KES) *" type="number" value={form.basicSalary} onChange={set('basicSalary')} size="small" /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Allowances (KES)" type="number" value={form.allowances} onChange={set('allowances')} size="small" /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Deductions (KES)" type="number" value={form.deductions} onChange={set('deductions')} size="small" /></Grid>
          {(form.basicSalary) && (
            <Grid item xs={12}>
              <Box sx={{ p: 1.5, bgcolor: netPreview >= 0 ? 'rgba(46,125,50,0.06)' : 'rgba(198,40,40,0.06)', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>Net Pay:</Typography>
                <Typography sx={{ fontWeight: 800, color: netPreview >= 0 ? '#2e7d32' : '#c62828' }}>KES {netPreview.toLocaleString()}</Typography>
              </Box>
            </Grid>
          )}
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Payment Method</InputLabel>
              <Select value={form.paymentMethod} label="Payment Method" onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}>
                {METHODS.map((m) => <MenuItem key={m} value={m}>{m.replace('_', ' ')}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}><TextField fullWidth label="Notes" multiline rows={2} value={form.notes} onChange={set('notes')} size="small" /></Grid>
        </Grid>
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button variant="outlined" fullWidth onClick={() => setDrawerOpen(false)}>Cancel</Button>
          <Button variant="contained" fullWidth onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.employeeId || !form.basicSalary}>
            {saveMutation.isPending ? <CircularProgress size={20} color="inherit" /> : (editId ? 'Update' : 'Create')}
          </Button>
        </Box>
      </Drawer>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Payroll</DialogTitle>
        <DialogContent><Typography>Delete payroll record for <strong>{selected?.employee?.fullName || selected?.employee?.firstName}</strong>?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => deleteMutation.mutate(selected?.id)} disabled={deleteMutation.isPending}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
