import React, { useState } from 'react';
import {
  Box, Card, Typography, TextField, Button, Table, TableBody, TableCell,
  TableHead, TableRow, Chip, IconButton, Menu, MenuItem, ListItemIcon,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, CircularProgress,
  Select, FormControl, InputLabel, Pagination, Drawer, InputAdornment,
  Tooltip, Badge,
} from '@mui/material';
import {
  Search, MoreVert, Edit, Delete, PersonAdd, CheckCircle,
  Visibility, FilterList, PersonSearch,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useSnackbar } from 'notistack';

const HOW_HEARD = ['Friend/Family', 'Social Media', 'Walk-in', 'Flyer/Poster', 'Radio/TV', 'Website', 'Other'];
const PURPOSE = ['Just Visiting', 'Interested in Membership', 'Event Attendance', 'Prayer Request', 'Other'];
const AGE_GROUPS = ['Child (under 12)', 'Youth (12–25)', 'Adult (26–60)', 'Senior (60+)'];

const emptyForm = {
  fullname: '', phone: '', email: '', address: '', gender: '', ageGroup: '',
  visitDate: new Date().toISOString().split('T')[0],
  invitedBy: '', howHeard: '', purposeOfVisit: '', notes: '',
};

export default function Visitors() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [followedUpFilter, setFollowedUpFilter] = useState('');
  const [page, setPage] = useState(1);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selected, setSelected] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [followUpDialog, setFollowUpDialog] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [followUpNote, setFollowUpNote] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  const params = new URLSearchParams({
    page: String(page), limit: '15',
    ...(search ? { search } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
    ...(followedUpFilter !== '' ? { followedUp: followedUpFilter } : {}),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['visitors', page, search, dateFrom, dateTo, followedUpFilter],
    queryFn: () => api.get(`/tenant/visitors?${params}`).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof form) => editId ? api.put(`/tenant/visitors/${editId}`, body) : api.post('/tenant/visitors', body),
    onSuccess: () => {
      enqueueSnackbar(editId ? 'Visitor updated' : 'Visitor recorded', { variant: 'success' });
      setDrawerOpen(false); setForm(emptyForm); setEditId(null);
      qc.invalidateQueries({ queryKey: ['visitors'] });
    },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Failed', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tenant/visitors/${id}`),
    onSuccess: () => {
      enqueueSnackbar('Visitor deleted', { variant: 'success' });
      setDeleteDialog(false);
      qc.invalidateQueries({ queryKey: ['visitors'] });
    },
  });

  const followUpMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      api.patch(`/tenant/visitors/${id}/follow-up`, { followedUp: true, followUpNote: note, followUpDate: new Date().toISOString() }),
    onSuccess: () => {
      enqueueSnackbar('Follow-up recorded', { variant: 'success' });
      setFollowUpDialog(false);
      qc.invalidateQueries({ queryKey: ['visitors'] });
    },
  });

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleEdit = (v: any) => {
    setForm({ ...v, visitDate: v.visitDate ? v.visitDate.split('T')[0] : '' });
    setEditId(v.id); setDrawerOpen(true); setAnchorEl(null);
  };

  const visitors = data?.data || [];
  const pagination = data?.pagination;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e' }}>First-Time Visitors</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>{pagination?.total || 0} visitors recorded</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Toggle filters">
            <IconButton onClick={() => setFilterOpen(!filterOpen)} color={filterOpen ? 'primary' : 'default'}>
              <Badge badgeContent={[dateFrom, dateTo, followedUpFilter].filter(Boolean).length} color="error">
                <FilterList />
              </Badge>
            </IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<PersonAdd />} onClick={() => { setForm(emptyForm); setEditId(null); setDrawerOpen(true); }}>
            Record Visitor
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 2, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth size="small" placeholder="Search name, phone, email..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }}
            />
          </Grid>
          {filterOpen && (
            <>
              <Grid item xs={6} md={2}>
                <TextField fullWidth size="small" label="From date" type="date" value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField fullWidth size="small" label="To date" type="date" value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Follow-up Status</InputLabel>
                  <Select value={followedUpFilter} label="Follow-up Status" onChange={(e) => { setFollowedUpFilter(e.target.value); setPage(1); }}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="true">Followed Up</MenuItem>
                    <MenuItem value="false">Pending Follow-up</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
        </Grid>
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
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Visit Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Age Group</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Purpose</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>How Heard</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Follow-up</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visitors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        No visitors recorded yet. Click "Record Visitor" to add the first one.
                      </TableCell>
                    </TableRow>
                  ) : visitors.map((v: any) => (
                    <TableRow key={v.id} hover>
                      <TableCell>
                        <Box>
                          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{v.fullname}</Typography>
                          {v.gender && <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>{v.gender}</Typography>}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.82rem' }}>{v.phone || '-'}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{v.email || ''}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{new Date(v.visitDate).toLocaleDateString()}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem' }}>{v.ageGroup || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', maxWidth: 140 }}>
                        <Typography sx={{ fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {v.purposeOfVisit || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem' }}>{v.howHeard || '-'}</TableCell>
                      <TableCell>
                        {v.followedUp ? (
                          <Chip label="Done" size="small" icon={<CheckCircle sx={{ fontSize: '14px !important' }} />}
                            sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600, fontSize: '0.7rem' }} />
                        ) : (
                          <Chip label="Pending" size="small"
                            sx={{ bgcolor: '#fff3e0', color: '#e65100', fontWeight: 600, fontSize: '0.7rem' }} />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={(e) => { setAnchorEl(e.currentTarget); setSelected(v); }}>
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
                Showing {visitors.length} of {pagination?.total || 0}
              </Typography>
              <Pagination count={pagination?.totalPages || 1} page={page} onChange={(_, v) => setPage(v)} size="small" color="primary" />
            </Box>
          </>
        )}
      </Card>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { setViewOpen(true); setAnchorEl(null); }}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>View Details
        </MenuItem>
        <MenuItem onClick={() => handleEdit(selected)}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>Edit
        </MenuItem>
        {!selected?.followedUp && (
          <MenuItem onClick={() => { setFollowUpDialog(true); setAnchorEl(null); }}>
            <ListItemIcon><PersonSearch fontSize="small" /></ListItemIcon>Mark Followed Up
          </MenuItem>
        )}
        <MenuItem onClick={() => { setDeleteDialog(true); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>Delete
        </MenuItem>
      </Menu>

      {/* Add/Edit Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 500 }, p: 3 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', mb: 3 }}>
          {editId ? 'Edit Visitor' : 'Record First-Time Visitor'}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}><TextField fullWidth label="Full Name *" value={form.fullname} onChange={set('fullname')} size="small" /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Phone" value={form.phone} onChange={set('phone')} size="small" /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Email" type="email" value={form.email} onChange={set('email')} size="small" /></Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Gender</InputLabel>
              <Select value={form.gender} label="Gender" onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}>
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="MALE">Male</MenuItem>
                <MenuItem value="FEMALE">Female</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Age Group</InputLabel>
              <Select value={form.ageGroup} label="Age Group" onChange={(e) => setForm((f) => ({ ...f, ageGroup: e.target.value }))}>
                <MenuItem value="">Select</MenuItem>
                {AGE_GROUPS.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Visit Date" type="date" value={form.visitDate} onChange={set('visitDate')} size="small" InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Invited By" value={form.invitedBy} onChange={set('invitedBy')} size="small" /></Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>How Did They Hear?</InputLabel>
              <Select value={form.howHeard} label="How Did They Hear?" onChange={(e) => setForm((f) => ({ ...f, howHeard: e.target.value }))}>
                <MenuItem value="">Select</MenuItem>
                {HOW_HEARD.map((h) => <MenuItem key={h} value={h}>{h}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Purpose of Visit</InputLabel>
              <Select value={form.purposeOfVisit} label="Purpose of Visit" onChange={(e) => setForm((f) => ({ ...f, purposeOfVisit: e.target.value }))}>
                <MenuItem value="">Select</MenuItem>
                {PURPOSE.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}><TextField fullWidth label="Address" value={form.address} onChange={set('address')} size="small" /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Notes" multiline rows={2} value={form.notes} onChange={set('notes')} size="small" /></Grid>
        </Grid>
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button variant="outlined" fullWidth onClick={() => setDrawerOpen(false)}>Cancel</Button>
          <Button variant="contained" fullWidth onClick={() => createMutation.mutate(form)}
            disabled={createMutation.isPending || !form.fullname}>
            {createMutation.isPending ? <CircularProgress size={20} color="inherit" /> : (editId ? 'Update' : 'Record Visitor')}
          </Button>
        </Box>
      </Drawer>

      {/* View Details Dialog */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#1a237e' }}>Visitor Details</DialogTitle>
        <DialogContent>
          {selected && (
            <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
              {[
                ['Full Name', selected.fullname], ['Phone', selected.phone], ['Email', selected.email],
                ['Gender', selected.gender], ['Age Group', selected.ageGroup],
                ['Visit Date', new Date(selected.visitDate).toLocaleDateString()],
                ['Invited By', selected.invitedBy], ['How Heard', selected.howHeard],
                ['Purpose', selected.purposeOfVisit], ['Address', selected.address],
              ].map(([label, value]) => value ? (
                <Grid item xs={6} key={label}>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{label}</Typography>
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 600 }}>{value}</Typography>
                </Grid>
              ) : null)}
              {selected.notes && (
                <Grid item xs={12}>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Notes</Typography>
                  <Typography sx={{ fontSize: '0.88rem' }}>{selected.notes}</Typography>
                </Grid>
              )}
              {selected.followUpNote && (
                <Grid item xs={12}>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Follow-up Note</Typography>
                  <Typography sx={{ fontSize: '0.88rem' }}>{selected.followUpNote}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Follow-up Dialog */}
      <Dialog open={followUpDialog} onClose={() => setFollowUpDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Record Follow-up</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Follow-up Note" multiline rows={3} value={followUpNote}
            onChange={(e) => setFollowUpNote(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFollowUpDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => followUpMutation.mutate({ id: selected?.id, note: followUpNote })}
            disabled={followUpMutation.isPending}>
            Save Follow-up
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Visitor Record</DialogTitle>
        <DialogContent>
          <Typography>Delete <strong>{selected?.fullname}</strong>'s visitor record? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => deleteMutation.mutate(selected?.id)}
            disabled={deleteMutation.isPending}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
