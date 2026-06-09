import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Chip, Button, Avatar,
  Divider, CircularProgress, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Tab, Tabs, Table, TableBody,
  TableCell, TableHead, TableRow,
} from '@mui/material';
import {
  ArrowBack, CheckCircle, Block, Delete, PersonSearch, VpnKey,
  Business, People, AttachMoney, Work,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useSnackbar } from 'notistack';

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: '#2e7d32', TRIAL: '#e65100', SUSPENDED: '#c62828',
  EXPIRED: '#616161', PENDING_VERIFICATION: '#1565c0',
};

function TabPanel({ value, index, children }: any) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

export default function TenantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [tab, setTab] = useState(0);
  const [resetDialog, setResetDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [subDialog, setSubDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [newPlan, setNewPlan] = useState('');
  const [subExpiry, setSubExpiry] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['tenant', id],
    queryFn: () => api.get(`/superadmin/tenants/${id}`).then((r) => r.data.data),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/superadmin/tenants/${id}/status`, { status }),
    onSuccess: () => { enqueueSnackbar('Status updated', { variant: 'success' }); queryClient.invalidateQueries({ queryKey: ['tenant', id] }); },
    onError: () => enqueueSnackbar('Failed', { variant: 'error' }),
  });

  const resetMutation = useMutation({
    mutationFn: () => api.post(`/superadmin/tenants/${id}/reset-password`, { adminEmail, newPassword }),
    onSuccess: () => { enqueueSnackbar('Password reset', { variant: 'success' }); setResetDialog(false); },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Failed', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/superadmin/tenants/${id}`, { data: { confirm: 'DELETE' } }),
    onSuccess: () => { enqueueSnackbar('Tenant deleted', { variant: 'success' }); navigate('/superadmin/tenants'); },
    onError: () => enqueueSnackbar('Delete failed', { variant: 'error' }),
  });

  const impersonateMutation = useMutation({
    mutationFn: () => api.post(`/auth/impersonate/${id}`),
    onSuccess: (res) => {
      localStorage.setItem('accessToken', res.data.data.accessToken);
      localStorage.setItem('refreshToken', res.data.data.refreshToken);
      enqueueSnackbar(`Impersonating ${res.data.data.tenant.name}`, { variant: 'info' });
      window.open('/dashboard', '_blank');
    },
  });

  const subMutation = useMutation({
    mutationFn: () => api.patch(`/superadmin/tenants/${id}/subscription`, { plan: newPlan, expiresAt: subExpiry }),
    onSuccess: () => { enqueueSnackbar('Subscription updated', { variant: 'success' }); setSubDialog(false); queryClient.invalidateQueries({ queryKey: ['tenant', id] }); },
    onError: () => enqueueSnackbar('Failed', { variant: 'error' }),
  });

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}><CircularProgress /></Box>;
  if (!data) return <Alert severity="error">Tenant not found</Alert>;

  const t = data;
  const infoRows = [
    ['Church Name', t.name], ['Email', t.email], ['Phone', t.phone || '-'],
    ['Website', t.website || '-'], ['Address', `${t.city || ''} ${t.state || ''} ${t.country}`],
    ['Church Type', t.churchType || '-'], ['Church Size', t.churchSize || '-'],
    ['Branches', t.numberOfBranches], ['Reg. Number', t.registrationNumber || '-'],
    ['Verified', t.isVerified ? 'Yes' : 'No'], ['Created', new Date(t.createdAt).toLocaleDateString()],
    ['Trial Ends', t.trialEndsAt ? new Date(t.trialEndsAt).toLocaleDateString() : '-'],
    ['Sub Ends', t.subscriptionEndsAt ? new Date(t.subscriptionEndsAt).toLocaleDateString() : '-'],
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/superadmin/tenants')} variant="outlined" size="small">Back</Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e' }}>{t.name}</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>{t.email}</Typography>
        </Box>
        <Chip label={t.status} size="small" sx={{ bgcolor: `${STATUS_COLOR[t.status]}18`, color: STATUS_COLOR[t.status], fontWeight: 700 }} />
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
        <Button variant="contained" startIcon={<PersonSearch />} onClick={() => impersonateMutation.mutate()} size="small" sx={{ bgcolor: '#1565c0' }}>Impersonate</Button>
        {t.status !== 'ACTIVE' && <Button variant="contained" startIcon={<CheckCircle />} onClick={() => statusMutation.mutate('ACTIVE')} size="small" sx={{ bgcolor: '#2e7d32' }}>Activate</Button>}
        {t.status !== 'SUSPENDED' && <Button variant="outlined" startIcon={<Block />} onClick={() => statusMutation.mutate('SUSPENDED')} size="small" color="warning">Suspend</Button>}
        <Button variant="outlined" startIcon={<VpnKey />} onClick={() => { setAdminEmail(t.users?.[0]?.email || ''); setResetDialog(true); }} size="small">Reset Password</Button>
        <Button variant="outlined" startIcon={<AttachMoney />} onClick={() => { setNewPlan(t.subscriptionPlan); setSubDialog(true); }} size="small">Update Plan</Button>
        <Button variant="outlined" color="error" startIcon={<Delete />} onClick={() => setDeleteDialog(true)} size="small">Delete</Button>
      </Box>

      {/* Stats Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { icon: <People />, label: 'Members', value: t._count?.members, color: '#6a1b9a' },
          { icon: <Work />, label: 'Employees', value: t._count?.employees, color: '#1565c0' },
          { icon: <Business />, label: 'Donations', value: t._count?.donations, color: '#2e7d32' },
          { icon: <AttachMoney />, label: 'Assets', value: t._count?.assets, color: '#e65100' },
        ].map((s) => (
          <Grid item xs={6} md={3} key={s.label}>
            <Card>
              <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, mx: 'auto', mb: 1 }}>
                  {s.icon}
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: s.color }}>{s.value ?? 0}</Typography>
                <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid rgba(0,0,0,0.08)', px: 2 }}>
          <Tab label="Church Info" />
          <Tab label="Admin Users" />
          <Tab label="Subscription" />
        </Tabs>

        <TabPanel value={tab} index={0}>
          <Box sx={{ px: 3 }}>
            <Grid container spacing={2}>
              {infoRows.map(([label, value]) => (
                <Grid item xs={12} sm={6} md={4} key={String(label)}>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Typography>
                  <Typography sx={{ fontWeight: 600, mt: 0.3 }}>{String(value)}</Typography>
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <Box sx={{ px: 3 }}>
            {(t.users || []).length === 0 ? (
              <Typography sx={{ color: 'text.secondary' }}>No admin users found</Typography>
            ) : (
              <Table size="small">
                <TableHead><TableRow><TableCell sx={{ fontWeight: 700 }}>Name</TableCell><TableCell sx={{ fontWeight: 700 }}>Email</TableCell><TableCell sx={{ fontWeight: 700 }}>Phone</TableCell><TableCell sx={{ fontWeight: 700 }}>Status</TableCell><TableCell sx={{ fontWeight: 700 }}>Last Login</TableCell></TableRow></TableHead>
                <TableBody>
                  {t.users.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.fullname}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.phone || '-'}</TableCell>
                      <TableCell><Chip label={u.status} size="small" /></TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tab} index={2}>
          <Box sx={{ px: 3 }}>
            <Grid container spacing={2}>
              {[['Plan', t.subscriptionPlan], ['Status', t.status], ['Trial Ends', t.trialEndsAt ? new Date(t.trialEndsAt).toLocaleDateString() : 'N/A'], ['Subscription Ends', t.subscriptionEndsAt ? new Date(t.subscriptionEndsAt).toLocaleDateString() : 'N/A']].map(([l, v]) => (
                <Grid item xs={12} sm={6} key={String(l)}>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase' }}>{l}</Typography>
                  <Typography sx={{ fontWeight: 600, mt: 0.3 }}>{String(v)}</Typography>
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>
      </Card>

      {/* Dialogs */}
      <Dialog open={resetDialog} onClose={() => setResetDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reset Admin Password</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Admin Email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} sx={{ mb: 2, mt: 1 }} />
          <TextField fullWidth label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending}>Reset</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={subDialog} onClose={() => setSubDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Update Subscription</DialogTitle>
        <DialogContent>
          <TextField select fullWidth label="Plan" value={newPlan} onChange={(e) => setNewPlan(e.target.value)} sx={{ mb: 2, mt: 1 }}>
            {['STARTER', 'STANDARD', 'PROFESSIONAL', 'ENTERPRISE'].map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
          </TextField>
          <TextField fullWidth label="Expiry Date" type="date" value={subExpiry} onChange={(e) => setSubExpiry(e.target.value)} InputLabelProps={{ shrink: true }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => subMutation.mutate()} disabled={subMutation.isPending}>Update</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>Delete Tenant</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>Permanent deletion — this cannot be undone.</Alert>
          <TextField fullWidth placeholder="Type DELETE to confirm" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => deleteMutation.mutate()} disabled={deleteConfirm !== 'DELETE' || deleteMutation.isPending}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
