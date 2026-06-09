import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, TextField, Button,
  Table, TableBody, TableCell, TableHead, TableRow, Chip,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Tab, Tabs, FormControl, InputLabel, Select,
  MenuItem, Avatar, Divider, Pagination,
} from '@mui/material';
import { Save, Edit, Delete, Add, Visibility, VisibilityOff, AdminPanelSettings, History, Business, Draw } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useSnackbar } from 'notistack';

const ROLES = ['TENANT_ADMIN', 'ADMIN', 'MANAGER', 'STAFF', 'VIEWER'];
const POSITIONS = [
  'Church Administrator', 'Finance Officer', 'Secretary', 'Chairperson',
  'Treasurer', 'Church Elder', 'Deacon', 'Deaconess', 'Youth Leader',
  "Women's Leader", 'Worship Leader', 'Evangelism Coordinator',
  'IT Officer', 'Communications Officer', 'General Staff',
];
const CURRENCIES = ['KES', 'USD', 'EUR', 'GBP', 'UGX', 'TZS', 'ZAR', 'NGN', 'GHS'];
const TIMEZONES = ['Africa/Nairobi', 'Africa/Lagos', 'Africa/Accra', 'Africa/Kampala', 'Africa/Dar_es_Salaam', 'UTC', 'America/New_York', 'Europe/London'];
const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];

function TabPanel({ value, index, children }: any) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

export default function Settings() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [userDialog, setUserDialog] = useState(false);
  const [deleteUserDialog, setDeleteUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [logPage, setLogPage] = useState(1);

  const [profile, setProfile] = useState({ name: '', email: '', phone: '', country: '', city: '', state: '', address: '', website: '', description: '', type: '', registrationNo: '' });
  const [prefs, setPrefs] = useState({ currency: 'KES', timezone: 'Africa/Nairobi', dateFormat: 'DD/MM/YYYY', memberPrefix: 'MBR', employeePrefix: 'EMP' });
  const [pastor, setPastor] = useState({ pastorName: '', pastorSignature: '' });
  const [sigPreview, setSigPreview] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [userForm, setUserForm] = useState({ fullname: '', email: '', phone: '', role: 'STAFF', position: '', password: '' });
  const [editUserId, setEditUserId] = useState<string | null>(null);

  const { data: settingsData, isLoading: loadingSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/tenant/settings').then((r) => r.data.data),
  });

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['settings-users'],
    queryFn: () => api.get('/tenant/settings/users').then((r) => r.data.data),
  });

  const { data: auditData } = useQuery({
    queryKey: ['audit-logs', logPage],
    queryFn: () => api.get(`/tenant/settings/audit-logs?page=${logPage}&limit=20`).then((r) => r.data),
  });

  useEffect(() => {
    if (settingsData) {
      const t = settingsData.tenant || {};
      setProfile({ name: t.name || '', email: t.email || '', phone: t.phone || '', country: t.country || '', city: t.city || '', state: t.state || '', address: t.address || '', website: t.website || '', description: t.description || '', type: t.type || '', registrationNo: t.registrationNo || '' });
      const s = settingsData.settings || {};
      setPrefs({ currency: s.currency || 'KES', timezone: s.timezone || 'Africa/Nairobi', dateFormat: s.dateFormat || 'DD/MM/YYYY', memberPrefix: s.memberPrefix || 'MBR', employeePrefix: s.employeePrefix || 'EMP' });
      setPastor({ pastorName: s.pastorName || '', pastorSignature: s.pastorSignature || '' });
      if (s.pastorSignature) setSigPreview(s.pastorSignature);
    }
  }, [settingsData]);

  const saveProfileMutation = useMutation({
    mutationFn: (body: typeof profile) => api.patch('/tenant/settings/church', body),
    onSuccess: () => { enqueueSnackbar('Church profile updated', { variant: 'success' }); queryClient.invalidateQueries({ queryKey: ['settings'] }); },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Failed', { variant: 'error' }),
  });

  const savePrefsMutation = useMutation({
    mutationFn: (body: any) => api.patch('/tenant/settings/preferences', body),
    onSuccess: () => { enqueueSnackbar('Preferences saved', { variant: 'success' }); queryClient.invalidateQueries({ queryKey: ['settings'] }); },
    onError: () => enqueueSnackbar('Failed to save preferences', { variant: 'error' }),
  });

  const handleSigUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setSigPreview(b64);
      setPastor((p) => ({ ...p, pastorSignature: b64 }));
    };
    reader.readAsDataURL(file);
  };

  const changePasswordMutation = useMutation({
    mutationFn: (body: typeof passwordForm) => api.post('/tenant/settings/change-password', body),
    onSuccess: () => { enqueueSnackbar('Password changed successfully', { variant: 'success' }); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Failed', { variant: 'error' }),
  });

  const saveUserMutation = useMutation({
    mutationFn: (body: typeof userForm) => editUserId ? api.patch(`/tenant/settings/users/${editUserId}`, body) : api.post('/tenant/settings/users', body),
    onSuccess: () => {
      enqueueSnackbar(editUserId ? 'User updated' : 'User added', { variant: 'success' });
      setUserDialog(false); setUserForm({ fullname: '', email: '', phone: '', role: 'STAFF', position: '', password: '' }); setEditUserId(null);
      queryClient.invalidateQueries({ queryKey: ['settings-users'] });
    },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Failed', { variant: 'error' }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tenant/settings/users/${id}`),
    onSuccess: () => { enqueueSnackbar('User removed', { variant: 'success' }); setDeleteUserDialog(false); queryClient.invalidateQueries({ queryKey: ['settings-users'] }); },
    onError: () => enqueueSnackbar('Delete failed', { variant: 'error' }),
  });

  const setP = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) => setProfile((p) => ({ ...p, [f]: e.target.value }));

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e' }}>Settings</Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>Manage your church configuration and users</Typography>
      </Box>

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: '1px solid rgba(0,0,0,0.08)' }} variant="scrollable" scrollButtons="auto">
          <Tab label="Church Profile" icon={<Business fontSize="small" />} iconPosition="start" />
          <Tab label="Users" icon={<AdminPanelSettings fontSize="small" />} iconPosition="start" />
          <Tab label="Preferences" />
          <Tab label="Password" />
          <Tab label="Audit Log" icon={<History fontSize="small" />} iconPosition="start" />
        </Tabs>

        {/* Church Profile */}
        <TabPanel value={tab} index={0}>
          <Box sx={{ px: 3, pb: 3 }}>
            {loadingSettings ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box> : (
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Church Name *" value={profile.name} onChange={setP('name')} size="small" /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Email" type="email" value={profile.email} onChange={setP('email')} size="small" /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Phone" value={profile.phone} onChange={setP('phone')} size="small" /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Website" value={profile.website} onChange={setP('website')} size="small" /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth label="Country" value={profile.country} onChange={setP('country')} size="small" /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth label="City" value={profile.city} onChange={setP('city')} size="small" /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth label="State / County" value={profile.state} onChange={setP('state')} size="small" /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Address" value={profile.address} onChange={setP('address')} size="small" /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Church Type" value={profile.type} onChange={setP('type')} size="small" placeholder="e.g., Pentecostal, Baptist" /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Registration No." value={profile.registrationNo} onChange={setP('registrationNo')} size="small" /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Description / Vision Statement" value={profile.description} onChange={setP('description')} multiline rows={3} size="small" /></Grid>
                <Grid item xs={12}>
                  <Button variant="contained" startIcon={<Save />} onClick={() => saveProfileMutation.mutate(profile)} disabled={saveProfileMutation.isPending || !profile.name}>
                    {saveProfileMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Save Profile'}
                  </Button>
                </Grid>
              </Grid>
            )}
          </Box>
        </TabPanel>

        {/* Users */}
        <TabPanel value={tab} index={1}>
          <Box sx={{ px: 3, pb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontWeight: 600 }}>System Users</Typography>
              <Button variant="outlined" startIcon={<Add />} onClick={() => { setUserForm({ fullname: '', email: '', phone: '', role: 'STAFF', position: '', password: '' }); setEditUserId(null); setUserDialog(true); }}>
                Add User
              </Button>
            </Box>
            {loadingUsers ? <CircularProgress /> : (
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8f9ff' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Position</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(usersData || []).map((u: any) => (
                    <TableRow key={u.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#1a237e', fontSize: '0.8rem' }}>{(u.fullname || u.email)?.[0]?.toUpperCase()}</Avatar>
                          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{u.fullname || '-'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.83rem' }}>{u.email}</TableCell>
                      <TableCell sx={{ fontSize: '0.83rem' }}>{u.phone || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.83rem' }}>{u.position || <span style={{ color: '#9e9e9e' }}>—</span>}</TableCell>
                      <TableCell><Chip label={u.role} size="small" sx={{ fontSize: '0.7rem', bgcolor: 'rgba(26,35,126,0.07)', color: '#1a237e' }} /></TableCell>
                      <TableCell><Chip label={u.isActive ? 'Active' : 'Inactive'} size="small" sx={{ fontSize: '0.7rem', bgcolor: u.isActive ? 'rgba(46,125,50,0.1)' : 'rgba(0,0,0,0.05)', color: u.isActive ? '#2e7d32' : 'text.secondary' }} /></TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => { setUserForm({ fullname: u.fullname || '', email: u.email, phone: u.phone || '', role: u.role, position: u.position || '', password: '' }); setEditUserId(u.id); setUserDialog(true); }}><Edit fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => { setSelectedUser(u); setDeleteUserDialog(true); }}><Delete fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        </TabPanel>

        {/* Preferences */}
        <TabPanel value={tab} index={2}>
          <Box sx={{ px: 3, pb: 3 }}>
            <Grid container spacing={2.5} sx={{ maxWidth: 500 }}>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Currency</InputLabel>
                  <Select value={prefs.currency} label="Currency" onChange={(e) => setPrefs((p) => ({ ...p, currency: e.target.value }))}>
                    {CURRENCIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Timezone</InputLabel>
                  <Select value={prefs.timezone} label="Timezone" onChange={(e) => setPrefs((p) => ({ ...p, timezone: e.target.value }))}>
                    {TIMEZONES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Date Format</InputLabel>
                  <Select value={prefs.dateFormat} label="Date Format" onChange={(e) => setPrefs((p) => ({ ...p, dateFormat: e.target.value }))}>
                    {DATE_FORMATS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}><TextField fullWidth label="Member Prefix" value={prefs.memberPrefix} onChange={(e) => setPrefs((p) => ({ ...p, memberPrefix: e.target.value }))} size="small" helperText="e.g. MBR → MBR-001" /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Employee Prefix" value={prefs.employeePrefix} onChange={(e) => setPrefs((p) => ({ ...p, employeePrefix: e.target.value }))} size="small" helperText="e.g. EMP → EMP-001" /></Grid>

              {/* Pastor / Certificate settings */}
              <Grid item xs={12}><Divider sx={{ my: 1 }}><Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', px: 1 }}>BAPTISM CERTIFICATE SETTINGS</Typography></Divider></Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Lead Pastor Name" value={pastor.pastorName}
                  onChange={(e) => setPastor((p) => ({ ...p, pastorName: e.target.value }))}
                  size="small" helperText="Appears on baptism certificates" />
              </Grid>
              <Grid item xs={12}>
                <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', mb: 1 }}>Pastor Signature (PNG/JPG, transparent background recommended)</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {sigPreview ? (
                    <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 1, bgcolor: '#fafafa' }}>
                      <img src={sigPreview} alt="Signature preview" style={{ height: 50, maxWidth: 200, objectFit: 'contain' }} />
                    </Box>
                  ) : (
                    <Box sx={{ border: '1px dashed #ccc', borderRadius: 1, p: 2, color: 'text.disabled', fontSize: '0.8rem' }}>
                      No signature uploaded
                    </Box>
                  )}
                  <Button variant="outlined" size="small" startIcon={<Draw />} component="label">
                    Upload Signature
                    <input type="file" accept="image/png,image/jpeg" hidden onChange={handleSigUpload} />
                  </Button>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Button variant="contained" startIcon={<Save />} onClick={() => savePrefsMutation.mutate({ ...prefs, ...pastor })} disabled={savePrefsMutation.isPending}>
                  {savePrefsMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Save Preferences'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Password */}
        <TabPanel value={tab} index={3}>
          <Box sx={{ px: 3, pb: 3 }}>
            <Grid container spacing={2.5} sx={{ maxWidth: 420 }}>
              <Grid item xs={12}>
                <TextField fullWidth label="Current Password" type={showPassword ? 'text' : 'password'} value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))} size="small"
                  InputProps={{ endAdornment: <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton> }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="New Password" type={showNewPassword ? 'text' : 'password'} value={passwordForm.newPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))} size="small"
                  InputProps={{ endAdornment: <IconButton size="small" onClick={() => setShowNewPassword(!showNewPassword)}>{showNewPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton> }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Confirm New Password" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))} size="small"
                  error={!!passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword}
                  helperText={passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword ? 'Passwords do not match' : ''} />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" onClick={() => changePasswordMutation.mutate(passwordForm)} disabled={changePasswordMutation.isPending || !passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}>
                  {changePasswordMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Change Password'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Audit Log */}
        <TabPanel value={tab} index={4}>
          <Box sx={{ px: 3, pb: 3 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8f9ff' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Entity</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(auditData?.data || []).length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>No audit logs available.</TableCell></TableRow>
                ) : (auditData?.data || []).map((log: any) => (
                  <TableRow key={log.id} hover>
                    <TableCell sx={{ fontSize: '0.78rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: '0.82rem' }}>{log.user?.fullname || log.user?.email || 'System'}</TableCell>
                    <TableCell><Chip label={log.action} size="small" sx={{ fontSize: '0.68rem', bgcolor: 'rgba(26,35,126,0.07)', color: '#1a237e', fontFamily: 'monospace' }} /></TableCell>
                    <TableCell sx={{ fontSize: '0.82rem' }}>{log.entity || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.78rem', color: 'text.secondary', maxWidth: 200 }}>{typeof log.details === 'object' ? JSON.stringify(log.details).slice(0, 60) : String(log.details || '-')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Pagination count={auditData?.pagination?.totalPages || 1} page={logPage} onChange={(_, v) => setLogPage(v)} size="small" />
            </Box>
          </Box>
        </TabPanel>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog open={userDialog} onClose={() => setUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editUserId ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}><TextField fullWidth label="Full Name *" value={userForm.fullname} onChange={(e) => setUserForm((f) => ({ ...f, fullname: e.target.value }))} size="small" /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Email *" type="email" value={userForm.email} onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))} size="small" disabled={!!editUserId} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Phone" value={userForm.phone} onChange={(e) => setUserForm((f) => ({ ...f, phone: e.target.value }))} size="small" /></Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Role</InputLabel>
                <Select value={userForm.role} label="Role" onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))}>
                  {ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Position / Title</InputLabel>
                <Select value={userForm.position} label="Position / Title" onChange={(e) => setUserForm((f) => ({ ...f, position: e.target.value }))}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  {POSITIONS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            {!editUserId && <Grid item xs={12}><TextField fullWidth label="Password *" type="password" value={userForm.password} onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))} size="small" /></Grid>}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => saveUserMutation.mutate(userForm)} disabled={saveUserMutation.isPending || !userForm.fullname || !userForm.email}>
            {saveUserMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteUserDialog} onClose={() => setDeleteUserDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove User</DialogTitle>
        <DialogContent><Typography>Remove <strong>{selectedUser?.fullname}</strong> from the system?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteUserDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => deleteUserMutation.mutate(selectedUser?.id)} disabled={deleteUserMutation.isPending}>Remove</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
