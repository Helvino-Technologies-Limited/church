import React, { useState } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, TextField, InputAdornment,
  Button, Table, TableBody, TableCell, TableHead, TableRow, Chip,
  IconButton, Menu, MenuItem, ListItemIcon, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Pagination,
  FormControl, InputLabel, Select, Drawer, Tab, Tabs, Divider,
} from '@mui/material';
import {
  Add, Edit, Delete, TrendingUp, TrendingDown, AccountBalance,
  MoreVert, Search,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../../services/api';
import { useSnackbar } from 'notistack';

const COLORS = ['#1a237e', '#c8a415', '#2e7d32', '#b71c1c', '#6a1b9a'];
const EXPENSE_CATEGORIES = ['Salaries', 'Utilities', 'Rent', 'Equipment', 'Maintenance', 'Events', 'Outreach', 'Welfare', 'Office', 'Transport', 'Other'];
const METHODS = ['CASH', 'MPESA', 'AIRTEL_MONEY', 'BANK_TRANSFER', 'CHEQUE', 'CARD'];
const emptyForm = { description: '', amount: '', currency: 'KES', category: '', paymentMethod: 'CASH', paidTo: '', approvedBy: '', receiptNo: '', notes: '', paidAt: '' };

function TabPanel({ value, index, children }: any) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

function BalanceCard({ label, value, icon, color, sub }: any) {
  return (
    <Card sx={{ borderLeft: `4px solid ${color}` }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', fontWeight: 600 }}>{label}</Typography>
          <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</Box>
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 800, color }}>{value}</Typography>
        {sub && <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mt: 0.3 }}>{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

export default function Finance() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selected, setSelected] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  const year = new Date().getFullYear();

  const { data: reportData } = useQuery({
    queryKey: ['finance-report', year],
    queryFn: () => api.get(`/tenant/reports/finance?year=${year}`).then((r) => r.data.data),
  });

  const { data: expenseData, isLoading } = useQuery({
    queryKey: ['expenses', page, search, category],
    queryFn: () => api.get(`/tenant/expenses?page=${page}&limit=15&search=${search}&category=${category}`).then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (body: typeof form) => editId
      ? api.put(`/tenant/expenses/${editId}`, { ...body, amount: Number(body.amount) })
      : api.post('/tenant/expenses', { ...body, amount: Number(body.amount) }),
    onSuccess: () => {
      enqueueSnackbar(editId ? 'Expense updated' : 'Expense recorded', { variant: 'success' });
      setDrawerOpen(false); setForm(emptyForm); setEditId(null);
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['finance-report'] });
    },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Failed', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tenant/expenses/${id}`),
    onSuccess: () => { enqueueSnackbar('Expense deleted', { variant: 'success' }); setDeleteDialog(false); queryClient.invalidateQueries({ queryKey: ['expenses'] }); },
    onError: () => enqueueSnackbar('Delete failed', { variant: 'error' }),
  });

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleEdit = (ex: any) => {
    setForm({ description: ex.description || '', amount: String(ex.amount || ''), currency: ex.currency || 'KES', category: ex.category || '', paymentMethod: ex.paymentMethod || 'CASH', paidTo: ex.paidTo || '', approvedBy: ex.approvedBy || '', receiptNo: ex.receiptNo || '', notes: ex.notes || '', paidAt: ex.paidAt ? ex.paidAt.split('T')[0] : '' });
    setEditId(ex.id); setDrawerOpen(true); setAnchorEl(null);
  };

  const totalIncome = Number(reportData?.totalIncome || 0);
  const totalExpenses = Number(reportData?.totalExpenses || 0);
  const netBalance = Number(reportData?.netBalance || 0);
  const expenses = expenseData?.data || [];
  const pagination = expenseData?.pagination;

  const incomeVsExpense = [
    { name: 'Income', value: totalIncome, fill: '#2e7d32' },
    { name: 'Expenses', value: totalExpenses, fill: '#c62828' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e' }}>Finance</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>Financial year {year} overview</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm(emptyForm); setEditId(null); setDrawerOpen(true); setTab(1); }}>
          Record Expense
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <BalanceCard label="TOTAL INCOME" value={`KES ${totalIncome.toLocaleString()}`} icon={<TrendingUp />} color="#2e7d32" sub={`${year} fiscal year`} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <BalanceCard label="TOTAL EXPENSES" value={`KES ${totalExpenses.toLocaleString()}`} icon={<TrendingDown />} color="#c62828" sub={`${year} fiscal year`} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <BalanceCard label="NET BALANCE" value={`KES ${Math.abs(netBalance).toLocaleString()}`} icon={<AccountBalance />} color={netBalance >= 0 ? '#2e7d32' : '#c62828'} sub={netBalance >= 0 ? 'Surplus' : 'Deficit'} />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 700, mb: 2 }}>Income vs Expenses</Typography>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={incomeVsExpense} barSize={50}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <RTooltip formatter={(v: number) => [`KES ${v.toLocaleString()}`, '']} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {incomeVsExpense.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {reportData?.expenseByCategory?.length > 0 && (
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontWeight: 700, mb: 2 }}>Expenses by Category</Typography>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={reportData.expenseByCategory.slice(0, 6).map((d: any) => ({ name: d.category || 'Other', value: Number(d._sum.amount || 0) }))} cx="50%" cy="50%" outerRadius={65} paddingAngle={3} dataKey="value">
                      {reportData.expenseByCategory.slice(0, 6).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <RTooltip formatter={(v: number) => [`KES ${Number(v).toLocaleString()}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {reportData?.donationByCategory?.length > 0 && (
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontWeight: 700, mb: 2 }}>Donations by Category</Typography>
                {reportData.donationByCategory.slice(0, 5).map((d: any, i: number) => (
                  <Box key={d.category} sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                      <Typography sx={{ fontSize: '0.82rem' }}>{d.category || 'General'}</Typography>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>KES {Number(d._sum.amount).toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ height: 6, bgcolor: 'rgba(0,0,0,0.06)', borderRadius: 3 }}>
                      <Box sx={{ height: '100%', bgcolor: COLORS[i % COLORS.length], borderRadius: 3, width: `${Math.min((Number(d._sum.amount) / totalIncome) * 100, 100)}%` }} />
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Tabs: Expenses / Payment Methods */}
      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <Tab label="Expenses" />
          <Tab label="Expense Analysis" />
        </Tabs>

        <TabPanel value={tab} index={0}>
          <Box sx={{ px: 2, pb: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <TextField placeholder="Search expenses..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} size="small" sx={{ flex: 1, minWidth: 200 }} InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }} />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Category</InputLabel>
                <Select value={category} label="Category" onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
                  <MenuItem value="">All</MenuItem>
                  {EXPENSE_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>

            {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box> : (
              <>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8f9ff' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Ref No</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Paid To</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {expenses.length === 0 ? (
                        <TableRow><TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>No expenses recorded.</TableCell></TableRow>
                      ) : expenses.map((ex: any) => (
                        <TableRow key={ex.id} hover>
                          <TableCell sx={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#1a237e' }}>{ex.expenseNo}</TableCell>
                          <TableCell sx={{ fontSize: '0.85rem', maxWidth: 200 }}>{ex.description}</TableCell>
                          <TableCell sx={{ fontSize: '0.82rem' }}>{ex.paidTo || '-'}</TableCell>
                          <TableCell><Chip label={ex.category || 'Other'} size="small" sx={{ fontSize: '0.72rem' }} /></TableCell>
                          <TableCell sx={{ fontSize: '0.8rem' }}>{ex.paymentMethod?.replace('_', ' ')}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#c62828', fontSize: '0.85rem' }}>KES {Number(ex.amount).toLocaleString()}</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{new Date(ex.paidAt).toLocaleDateString()}</TableCell>
                          <TableCell align="center">
                            <IconButton size="small" onClick={(e) => { setAnchorEl(e.currentTarget); setSelected(ex); }}>
                              <MoreVert fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>Total: KES {Number(expenseData?.summary?.totalAmount || 0).toLocaleString()}</Typography>
                  <Pagination count={pagination?.totalPages || 1} page={page} onChange={(_, v) => setPage(v)} size="small" color="primary" />
                </Box>
              </>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <Box sx={{ px: 3, pb: 3 }}>
            {reportData?.expenseByCategory?.length > 0 ? (
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8f9ff' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Total Spent (KES)</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>% of Expenses</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.expenseByCategory.map((c: any) => (
                    <TableRow key={c.category} hover>
                      <TableCell>{c.category || 'Uncategorized'}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontWeight: 700 }}>{Number(c._sum.amount).toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', color: 'text.secondary' }}>
                        {totalExpenses > 0 ? `${((Number(c._sum.amount) / totalExpenses) * 100).toFixed(1)}%` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                    <TableCell sx={{ fontWeight: 800 }}>TOTAL</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontWeight: 800, color: '#c62828' }}>{totalExpenses.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontWeight: 700 }}>100%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>No expense analysis data available.</Typography>
            )}
          </Box>
        </TabPanel>
      </Card>

      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => handleEdit(selected)}><ListItemIcon><Edit fontSize="small" /></ListItemIcon>Edit</MenuItem>
        <MenuItem onClick={() => { setDeleteDialog(true); setAnchorEl(null); }} sx={{ color: 'error.main' }}><ListItemIcon><Delete fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>Delete</MenuItem>
      </Menu>

      {/* Add/Edit Expense Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 440 }, p: 3 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', mb: 3 }}>{editId ? 'Edit Expense' : 'Record Expense'}</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}><TextField fullWidth label="Description *" value={form.description} onChange={set('description')} size="small" /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Amount (KES) *" type="number" value={form.amount} onChange={set('amount')} size="small" /></Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select value={form.category} label="Category" onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {EXPENSE_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}><TextField fullWidth label="Paid To" value={form.paidTo} onChange={set('paidTo')} size="small" /></Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Payment Method</InputLabel>
              <Select value={form.paymentMethod} label="Payment Method" onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}>
                {METHODS.map((m) => <MenuItem key={m} value={m}>{m.replace('_', ' ')}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Date" type="date" value={form.paidAt} onChange={set('paidAt')} size="small" InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Approved By" value={form.approvedBy} onChange={set('approvedBy')} size="small" /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Receipt/Reference No" value={form.receiptNo} onChange={set('receiptNo')} size="small" /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Notes" multiline rows={2} value={form.notes} onChange={set('notes')} size="small" /></Grid>
        </Grid>
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button variant="outlined" fullWidth onClick={() => setDrawerOpen(false)}>Cancel</Button>
          <Button variant="contained" fullWidth onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.description || !form.amount}>
            {saveMutation.isPending ? <CircularProgress size={20} color="inherit" /> : (editId ? 'Update' : 'Record Expense')}
          </Button>
        </Box>
      </Drawer>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Expense</DialogTitle>
        <DialogContent><Typography>Delete expense: <strong>{selected?.description}</strong>?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => deleteMutation.mutate(selected?.id)} disabled={deleteMutation.isPending}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
