import React, { useState } from 'react';
import {
  Box, Card, Typography, TextField, InputAdornment, Button, Table,
  TableBody, TableCell, TableHead, TableRow, Chip, Avatar, IconButton,
  Menu, MenuItem, ListItemIcon, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, CircularProgress, Tooltip, Select, FormControl,
  InputLabel, Pagination,
} from '@mui/material';
import {
  Search, MoreVert, CheckCircle, Block, Delete, PersonSearch,
  VpnKey, Verified, Refresh, AddBusiness, Visibility,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useSnackbar } from 'notistack';

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: '#2e7d32', TRIAL: '#e65100', SUSPENDED: '#c62828',
  EXPIRED: '#616161', PENDING_VERIFICATION: '#1565c0',
};

export default function Tenants() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);

  const [resetDialog, setResetDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tenants', page, search, statusFilter],
    queryFn: () => api.get(`/superadmin/tenants?page=${page}&limit=15&search=${search}&status=${statusFilter}`).then((r) => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/superadmin/tenants/${id}/status`, { status }),
    onSuccess: (_, v) => {
      enqueueSnackbar(`Status updated to ${v.status}`, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: () => enqueueSnackbar('Failed to update status', { variant: 'error' }),
  });

  const impersonateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/auth/impersonate/${id}`),
    onSuccess: (res) => {
      localStorage.setItem('accessToken', res.data.data.accessToken);
      localStorage.setItem('refreshToken', res.data.data.refreshToken);
      enqueueSnackbar(`Impersonating ${res.data.data.tenant.name}`, { variant: 'info' });
      window.open('/dashboard', '_blank');
    },
    onError: () => enqueueSnackbar('Impersonation failed', { variant: 'error' }),
  });

  const resetMutation = useMutation({
    mutationFn: () => api.post(`/superadmin/tenants/${selectedTenant?.id}/reset-password`, { adminEmail, newPassword }),
    onSuccess: () => {
      enqueueSnackbar('Password reset successfully', { variant: 'success' });
      setResetDialog(false);
      setNewPassword(''); setAdminEmail('');
    },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Reset failed', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/superadmin/tenants/${selectedTenant?.id}`, { data: { confirm: 'DELETE' } }),
    onSuccess: () => {
      enqueueSnackbar('Tenant permanently deleted', { variant: 'success' });
      setDeleteDialog(false);
      setDeleteConfirm('');
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Delete failed', { variant: 'error' }),
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/superadmin/tenants/${id}/verify`),
    onSuccess: () => {
      enqueueSnackbar('Tenant verified and activated', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: () => enqueueSnackbar('Verification failed', { variant: 'error' }),
  });

  const tenants = data?.data || [];
  const pagination = data?.pagination;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e' }}>Church Tenants</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
            {pagination?.total || 0} total churches registered
          </Typography>
        </Box>
        <Button startIcon={<Refresh />} onClick={() => refetch()} variant="outlined" size="small">Refresh</Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, p: 2.5 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search churches..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            size="small"
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <MenuItem value="">All Statuses</MenuItem>
              {['ACTIVE', 'TRIAL', 'PENDING_VERIFICATION', 'SUSPENDED', 'EXPIRED'].map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Card>

      <Card>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8f9ff' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Church</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Plan</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Members</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Users</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Registered</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tenants.map((t: any) => (
                    <TableRow key={t.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#1a237e', fontSize: '0.75rem', fontWeight: 700 }}>
                            {t.name.slice(0, 2).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{t.name}</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{t.city}, {t.country}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>{t.email}</TableCell>
                      <TableCell>
                        <Chip label={t.subscriptionPlan} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', bgcolor: 'rgba(26,35,126,0.08)', color: '#1a237e' }} />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={t.status}
                          size="small"
                          sx={{ fontWeight: 600, fontSize: '0.7rem', bgcolor: `${STATUS_COLOR[t.status]}15`, color: STATUS_COLOR[t.status] }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{t._count?.members}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{t._count?.users}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => navigate(`/superadmin/tenants/${t.id}`)}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="More Actions">
                            <IconButton
                              size="small"
                              onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedTenant(t); }}
                            >
                              <MoreVert fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>

            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                Showing {tenants.length} of {pagination?.total || 0}
              </Typography>
              <Pagination
                count={pagination?.totalPages || 1}
                page={page}
                onChange={(_, v) => setPage(v)}
                size="small"
                color="primary"
              />
            </Box>
          </>
        )}
      </Card>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { navigate(`/superadmin/tenants/${selectedTenant?.id}`); setAnchorEl(null); }}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>View Details
        </MenuItem>
        <MenuItem onClick={() => { impersonateMutation.mutate(selectedTenant?.id); setAnchorEl(null); }}>
          <ListItemIcon><PersonSearch fontSize="small" /></ListItemIcon>Impersonate
        </MenuItem>
        {selectedTenant?.status !== 'ACTIVE' && (
          <MenuItem onClick={() => { statusMutation.mutate({ id: selectedTenant?.id, status: 'ACTIVE' }); setAnchorEl(null); }}>
            <ListItemIcon><CheckCircle fontSize="small" sx={{ color: '#2e7d32' }} /></ListItemIcon>Activate
          </MenuItem>
        )}
        {selectedTenant?.status === 'PENDING_VERIFICATION' && (
          <MenuItem onClick={() => { verifyMutation.mutate(selectedTenant?.id); setAnchorEl(null); }}>
            <ListItemIcon><Verified fontSize="small" sx={{ color: '#1565c0' }} /></ListItemIcon>Verify & Activate
          </MenuItem>
        )}
        {selectedTenant?.status !== 'SUSPENDED' && (
          <MenuItem onClick={() => { statusMutation.mutate({ id: selectedTenant?.id, status: 'SUSPENDED' }); setAnchorEl(null); }}>
            <ListItemIcon><Block fontSize="small" sx={{ color: '#c62828' }} /></ListItemIcon>Suspend
          </MenuItem>
        )}
        <MenuItem onClick={() => { setResetDialog(true); setAdminEmail(selectedTenant?.users?.[0]?.email || ''); setAnchorEl(null); }}>
          <ListItemIcon><VpnKey fontSize="small" /></ListItemIcon>Reset Admin Password
        </MenuItem>
        <MenuItem onClick={() => { setDeleteDialog(true); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>Delete Permanently
        </MenuItem>
      </Menu>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialog} onClose={() => setResetDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reset Admin Password</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'text.secondary', mb: 2, fontSize: '0.9rem' }}>
            Reset password for an admin of <strong>{selectedTenant?.name}</strong>
          </Typography>
          <TextField fullWidth label="Admin Email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} helperText="Minimum 8 characters" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending || !newPassword || !adminEmail}>
            {resetMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Reset Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>Permanently Delete Tenant</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This action is irreversible. All data for <strong>{selectedTenant?.name}</strong> will be permanently deleted.
          </Alert>
          <Typography sx={{ mb: 2, fontSize: '0.9rem' }}>Type <strong>DELETE</strong> to confirm:</Typography>
          <TextField fullWidth placeholder="DELETE" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} error={deleteConfirm !== '' && deleteConfirm !== 'DELETE'} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteConfirm !== 'DELETE' || deleteMutation.isPending}
          >
            {deleteMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
