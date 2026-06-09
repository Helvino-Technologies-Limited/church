import React, { useState } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, TextField, InputAdornment,
  Button, Table, TableBody, TableCell, TableHead, TableRow, Chip,
  IconButton, Menu, MenuItem, ListItemIcon, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Pagination,
  FormControl, InputLabel, Select, Drawer, Divider, Alert,
} from '@mui/material';
import {
  Search, MoreVert, Edit, Delete, Add, AttachMoney,
  TrendingUp, Receipt, FilterList,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import api from '../../services/api';
import { useSnackbar } from 'notistack';

const COLORS = ['#1a237e', '#c8a415', '#2e7d32', '#b71c1c', '#6a1b9a', '#0277bd'];
const CATEGORIES = ['Tithe', 'Offering', 'Building Fund', 'Missions', 'Special', 'Welfare', 'Pledge', 'Harvest'];
const METHODS = ['CASH', 'MPESA', 'AIRTEL_MONEY', 'BANK_TRANSFER', 'CHEQUE', 'CARD'];

const emptyForm = {
  memberName: '', memberId: '', amount: '', currency: 'KES',
  paymentMethod: 'CASH', category: 'Offering', description: '', receiptNo: '', donatedAt: '',
};

function StatCard({ label, value, icon, color, sub }: any) {
  return (
    <Card>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Typography>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</Box>
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e' }}>{value}</Typography>
        {sub && <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem', mt: 0.3 }}>{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

export default function Donations() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selected, setSelected] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['donations', page, search, category],
    queryFn: () => api.get(`/tenant/donations?page=${page}&limit=15&search=${search}&category=${category}`).then((r) => r.data),
  });

  const { data: reportData } = useQuery({
    queryKey: ['donations-report'],
    queryFn: () => api.get('/tenant/reports/finance').then((r) => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (body: typeof form) => editId
      ? api.put(`/tenant/donations/${editId}`, { ...body, amount: Number(body.amount) })
      : api.post('/tenant/donations', { ...body, amount: Number(body.amount) }),
    onSuccess: () => {
      enqueueSnackbar(editId ? 'Donation updated' : 'Donation recorded', { variant: 'success' });
      setDrawerOpen(false); setForm(emptyForm); setEditId(null);
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['donations-report'] });
    },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Failed', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tenant/donations/${id}`),
    onSuccess: () => {
      enqueueSnackbar('Donation deleted', { variant: 'success' });
      setDeleteDialog(false);
      queryClient.invalidateQueries({ queryKey: ['donations'] });
    },
    onError: () => enqueueSnackbar('Delete failed', { variant: 'error' }),
  });

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [f]: e.target.value }));

  const donations = data?.data || [];
  const pagination = data?.pagination;
  const totalAmount = data?.summary?.totalAmount || 0;
  const donationByCategory = reportData?.donationByCategory || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e' }}>Donations & Offerings</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>{pagination?.total || 0} total records</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm(emptyForm); setEditId(null); setDrawerOpen(true); }}>
          Record Donation
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Total Income" value={`KES ${Number(totalAmount).toLocaleString()}`} icon={<AttachMoney />} color="#2e7d32" sub={`${pagination?.total || 0} transactions`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="This Month" value={`KES ${Number(reportData?.totalIncome || 0).toLocaleString()}`} icon={<TrendingUp />} color="#1a237e" sub="Current fiscal year" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Categories" value={donationByCategory.length} icon={<FilterList />} color="#6a1b9a" sub="Income categories" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Net Balance" value={`KES ${Number((reportData?.netBalance) || 0).toLocaleString()}`} icon={<Receipt />} color={reportData?.netBalance >= 0 ? '#2e7d32' : '#c62828'} sub="Income minus expenses" />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Category breakdown */}
        {donationByCategory.length > 0 && (
          <Grid item xs={12} md={5}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontWeight: 700, mb: 2 }}>By Category</Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={donationByCategory.map((d: any) => ({ name: d.category || 'General', value: Number(d._sum.amount) }))} cx="50%" cy="50%" outerRadius={75} paddingAngle={2} dataKey="value">
                      {donationByCategory.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <RTooltip formatter={(v: number) => [`KES ${Number(v).toLocaleString()}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ mt: 1 }}>
                  {donationByCategory.slice(0, 5).map((d: any, i: number) => (
                    <Box key={d.category} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: COLORS[i % COLORS.length] }} />
                        <Typography sx={{ fontSize: '0.82rem' }}>{d.category || 'General'}</Typography>
                      </Box>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>KES {Number(d._sum.amount).toLocaleString()}</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Payment methods */}
        {reportData?.donationByMethod?.length > 0 && (
          <Grid item xs={12} md={7}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontWeight: 700, mb: 2 }}>By Payment Method</Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={reportData.donationByMethod.map((d: any) => ({ name: d.paymentMethod, amount: Number(d._sum.amount || 0) }))} barSize={30}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                    <RTooltip formatter={(v: number) => [`KES ${v.toLocaleString()}`, 'Amount']} />
                    <Bar dataKey="amount" fill="#1a237e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Table */}
      <Card>
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <TextField placeholder="Search donor, receipt..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} size="small" sx={{ flex: 1, minWidth: 200 }} InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }} />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select value={category} label="Category" onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
              <MenuItem value="">All</MenuItem>
              {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box> : (
          <>
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8f9ff' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Receipt No</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Donor</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {donations.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>No donations recorded yet.</TableCell></TableRow>
                  ) : donations.map((d: any) => (
                    <TableRow key={d.id} hover>
                      <TableCell><Typography sx={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#1a237e' }}>{d.receiptNo || '-'}</Typography></TableCell>
                      <TableCell sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{d.memberName || 'Anonymous'}</TableCell>
                      <TableCell><Chip label={d.category || 'General'} size="small" sx={{ fontSize: '0.72rem' }} /></TableCell>
                      <TableCell><Chip label={d.paymentMethod} size="small" variant="outlined" sx={{ fontSize: '0.72rem' }} /></TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2e7d32' }}>KES {Number(d.amount).toLocaleString()}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>{new Date(d.donatedAt).toLocaleDateString()}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={(e) => { setAnchorEl(e.currentTarget); setSelected(d); }}>
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>Showing {donations.length} of {pagination?.total || 0}</Typography>
              <Pagination count={pagination?.totalPages || 1} page={page} onChange={(_, v) => setPage(v)} size="small" color="primary" />
            </Box>
          </>
        )}
      </Card>

      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { setForm({ memberName: selected?.memberName || '', memberId: selected?.memberId || '', amount: String(selected?.amount || ''), currency: selected?.currency || 'KES', paymentMethod: selected?.paymentMethod || 'CASH', category: selected?.category || 'Offering', description: selected?.description || '', receiptNo: selected?.receiptNo || '', donatedAt: selected?.donatedAt ? selected.donatedAt.split('T')[0] : '' }); setEditId(selected?.id); setDrawerOpen(true); setAnchorEl(null); }}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>Edit
        </MenuItem>
        <MenuItem onClick={() => { setDeleteDialog(true); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>Delete
        </MenuItem>
      </Menu>

      {/* Add/Edit Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 440 }, p: 3 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', mb: 3 }}>{editId ? 'Edit Donation' : 'Record Donation'}</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}><TextField fullWidth label="Donor Name" value={form.memberName} onChange={set('memberName')} size="small" /></Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Amount *" type="number" value={form.amount} onChange={set('amount')} size="small" InputProps={{ startAdornment: <InputAdornment position="start">KES</InputAdornment> }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select value={form.category} label="Category" onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Payment Method</InputLabel>
              <Select value={form.paymentMethod} label="Payment Method" onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}>
                {METHODS.map((m) => <MenuItem key={m} value={m}>{m.replace('_', ' ')}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Date" type="date" value={form.donatedAt} onChange={set('donatedAt')} size="small" InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Receipt No (auto-generated if empty)" value={form.receiptNo} onChange={set('receiptNo')} size="small" /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Description / Notes" multiline rows={2} value={form.description} onChange={set('description')} size="small" /></Grid>
        </Grid>
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button variant="outlined" fullWidth onClick={() => setDrawerOpen(false)}>Cancel</Button>
          <Button variant="contained" fullWidth onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.amount}>
            {saveMutation.isPending ? <CircularProgress size={20} color="inherit" /> : (editId ? 'Update' : 'Record')}
          </Button>
        </Box>
      </Drawer>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Donation</DialogTitle>
        <DialogContent><Typography>Delete donation from <strong>{selected?.memberName || 'Anonymous'}</strong> — KES {Number(selected?.amount || 0).toLocaleString()}?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => deleteMutation.mutate(selected?.id)} disabled={deleteMutation.isPending}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
