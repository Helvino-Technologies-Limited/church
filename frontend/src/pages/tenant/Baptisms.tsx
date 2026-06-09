import React, { useState, useRef } from 'react';
import {
  Box, Card, Typography, Button, Table, TableBody, TableCell,
  TableHead, TableRow, Chip, IconButton, Menu, MenuItem, ListItemIcon,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, CircularProgress,
  Select, FormControl, InputLabel, Pagination, Drawer, TextField,
  InputAdornment, Avatar, Alert, Divider,
} from '@mui/material';
import {
  Search, MoreVert, Edit, Delete, Add, CheckCircle, Cancel,
  Download, Image as ImageIcon, Verified,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useSnackbar } from 'notistack';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import jsPDF from 'jspdf';

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: '#fff3e0', color: '#e65100' },
  APPROVED: { bg: '#e8f5e9', color: '#2e7d32' },
  REJECTED: { bg: '#ffebee', color: '#c62828' },
};

const emptyForm = {
  memberId: '', baptismDate: new Date().toISOString().split('T')[0],
  baptismType: 'WATER', officiantName: '', venue: '', witnesses: '', notes: '',
};

// ─── Certificate PDF generator ───────────────────────────────────────────────
function generateCertificate(baptism: any, tenantName: string, pastorName: string, pastorSig: string | null) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297; const H = 210;

  // Navy background border
  doc.setFillColor(26, 35, 126);
  doc.rect(0, 0, W, H, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(8, 8, W - 16, H - 16, 'F');
  doc.setFillColor(26, 35, 126);
  doc.rect(12, 12, W - 24, H - 24, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(16, 16, W - 32, H - 32, 'F');

  // Watermark — church name diagonal
  doc.saveGraphicsState();
  doc.setGState(new (doc as any).GState({ opacity: 0.06 }));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(52);
  doc.setTextColor(26, 35, 126);
  doc.text(tenantName.toUpperCase(), W / 2, H / 2, { align: 'center', angle: 340 });
  doc.restoreGraphicsState();

  // Gold top rule
  doc.setDrawColor(200, 164, 21);
  doc.setLineWidth(1.2);
  doc.line(30, 30, W - 30, 30);
  doc.line(30, 34, W - 30, 34);

  // Title
  doc.setFont('times', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(26, 35, 126);
  doc.text('CERTIFICATE OF BAPTISM', W / 2, 50, { align: 'center' });

  // Church name subtitle
  doc.setFont('times', 'italic');
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text(tenantName, W / 2, 60, { align: 'center' });

  // Cert number top-right
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(`Certificate No: ${baptism.certificateNo || 'N/A'}`, W - 30, 22, { align: 'right' });

  // Member photo (left column)
  const photoX = 30; const photoY = 72; const photoW = 44; const photoH = 52;
  if (baptism.photo) {
    try {
      doc.addImage(baptism.photo, 'JPEG', photoX, photoY, photoW, photoH);
    } catch {
      doc.setFillColor(230, 230, 240);
      doc.rect(photoX, photoY, photoW, photoH, 'F');
      doc.setFontSize(8); doc.setTextColor(150, 150, 150);
      doc.text('Photo', photoX + photoW / 2, photoY + photoH / 2, { align: 'center' });
    }
  } else {
    doc.setFillColor(230, 230, 240);
    doc.rect(photoX, photoY, photoW, photoH, 'F');
    doc.setFontSize(8); doc.setTextColor(150, 150, 150);
    doc.text('No Photo', photoX + photoW / 2, photoY + photoH / 2, { align: 'center' });
  }
  doc.setDrawColor(200, 164, 21);
  doc.setLineWidth(0.8);
  doc.rect(photoX, photoY, photoW, photoH);

  // Body text (right of photo)
  const cx = 88;
  doc.setFont('times', 'italic');
  doc.setFontSize(13);
  doc.setTextColor(80, 80, 80);
  doc.text('This is to certify that', cx, 80);

  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(26, 35, 126);
  doc.text(baptism.member?.fullname || '', cx, 93);

  doc.setFont('times', 'italic');
  doc.setFontSize(13);
  doc.setTextColor(80, 80, 80);
  doc.text('was baptized on', cx, 106);

  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(26, 35, 126);
  const bDate = new Date(baptism.baptismDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(bDate, cx, 116);

  if (baptism.venue) {
    doc.setFont('times', 'italic'); doc.setFontSize(12); doc.setTextColor(80, 80, 80);
    doc.text(`at ${baptism.venue}`, cx, 126);
  }

  const typeLabel = baptism.baptismType === 'WATER' ? 'Water Baptism' : baptism.baptismType === 'HOLY_SPIRIT' ? 'Holy Spirit Baptism' : 'Water & Holy Spirit Baptism';
  doc.setFont('times', 'normal'); doc.setFontSize(11); doc.setTextColor(100, 100, 100);
  doc.text(`Type: ${typeLabel}`, cx, 135);

  if (baptism.witnesses) {
    doc.text(`Witnesses: ${baptism.witnesses}`, cx, 143);
  }

  // Gold bottom rule
  doc.setDrawColor(200, 164, 21); doc.setLineWidth(1.2);
  doc.line(30, 154, W - 30, 154);

  // Signature section
  const sigY = 170;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 100, 100);

  // Pastor signature
  if (pastorSig) {
    try { doc.addImage(pastorSig, 'PNG', 42, sigY - 16, 48, 14); } catch {}
  }
  doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.4);
  doc.line(30, sigY, 110, sigY);
  doc.text('Pastor\'s Signature', 70, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(26, 35, 126);
  doc.text(pastorName || 'Pastor', 70, sigY + 11, { align: 'center' });

  // Church stamp placeholder
  doc.setDrawColor(26, 35, 126); doc.setLineWidth(0.8);
  doc.circle(W / 2, sigY - 6, 15);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(26, 35, 126);
  doc.text('CHURCH', W / 2, sigY - 8, { align: 'center' });
  doc.text('STAMP', W / 2, sigY - 2, { align: 'center' });

  // Date of issue
  doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.4);
  doc.line(W - 110, sigY, W - 30, sigY);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 100, 100);
  const issueDate = baptism.approvedAt ? new Date(baptism.approvedAt).toLocaleDateString('en-KE') : new Date().toLocaleDateString('en-KE');
  doc.text(issueDate, W - 70, sigY - 3, { align: 'center' });
  doc.text('Date Issued', W - 70, sigY + 5, { align: 'center' });

  // Bottom gold rule
  doc.setDrawColor(200, 164, 21); doc.setLineWidth(1.2);
  doc.line(30, H - 24, W - 30, H - 24);
  doc.line(30, H - 20, W - 30, H - 20);

  // Footer
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(160, 160, 160);
  doc.text('Powered by CMS-360 • Helvino Technologies LTD', W / 2, H - 14, { align: 'center' });

  doc.save(`Baptism_Certificate_${(baptism.member?.fullname || 'member').replace(/\s+/g, '_')}_${baptism.certificateNo}.pdf`);
}

export default function Baptisms() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const user = useSelector((s: RootState) => s.auth.user);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selected, setSelected] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  const { data: membersData } = useQuery({
    queryKey: ['members-list'],
    queryFn: () => api.get('/tenant/members?limit=200').then((r) => r.data.data),
  });

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/tenant/settings').then((r) => r.data.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['baptisms', page, search, statusFilter],
    queryFn: () => api.get(`/tenant/baptisms?page=${page}&limit=15&search=${search}&status=${statusFilter}`).then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (body: any) => editId ? api.put(`/tenant/baptisms/${editId}`, body) : api.post('/tenant/baptisms', body),
    onSuccess: async (res) => {
      const id = res.data.data.id;
      if (photoBase64 && !editId) {
        await api.patch(`/tenant/baptisms/${id}/photo`, { photo: photoBase64 });
      } else if (photoBase64 && editId) {
        await api.patch(`/tenant/baptisms/${editId}/photo`, { photo: photoBase64 });
      }
      enqueueSnackbar(editId ? 'Baptism record updated' : 'Baptism recorded', { variant: 'success' });
      setDrawerOpen(false); setForm(emptyForm); setEditId(null); setPhotoPreview(null); setPhotoBase64(null);
      qc.invalidateQueries({ queryKey: ['baptisms'] });
    },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Failed', { variant: 'error' }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/tenant/baptisms/${id}/approve`, {}),
    onSuccess: () => { enqueueSnackbar('Baptism approved — certificate ready', { variant: 'success' }); qc.invalidateQueries({ queryKey: ['baptisms'] }); },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Failed', { variant: 'error' }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.patch(`/tenant/baptisms/${id}/reject`, { reason }),
    onSuccess: () => { enqueueSnackbar('Baptism rejected', { variant: 'warning' }); setRejectDialog(false); qc.invalidateQueries({ queryKey: ['baptisms'] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tenant/baptisms/${id}`),
    onSuccess: () => { enqueueSnackbar('Deleted', { variant: 'success' }); setDeleteDialog(false); qc.invalidateQueries({ queryKey: ['baptisms'] }); },
    onError: (e: any) => enqueueSnackbar(e.response?.data?.error || 'Cannot delete', { variant: 'error' }),
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { enqueueSnackbar('Photo must be under 2 MB', { variant: 'warning' }); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setPhotoPreview(b64); setPhotoBase64(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleEdit = (b: any) => {
    setForm({ memberId: b.memberId, baptismDate: b.baptismDate?.split('T')[0] || '', baptismType: b.baptismType, officiantName: b.officiantName || '', venue: b.venue || '', witnesses: b.witnesses || '', notes: b.notes || '' });
    setPhotoPreview(b.photo || null); setPhotoBase64(null);
    setEditId(b.id); setDrawerOpen(true); setAnchorEl(null);
  };

  const handleDownload = (b: any) => {
    const tenantName = user?.tenant?.name || 'Church';
    const pastorName = settingsData?.pastorName || '';
    const pastorSig = settingsData?.pastorSignature || null;
    generateCertificate(b, tenantName, pastorName, pastorSig);
  };

  const baptisms = data?.data || [];
  const pagination = data?.pagination;
  const members = membersData || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e' }}>Baptism Records</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>{pagination?.total || 0} baptism records</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm(emptyForm); setEditId(null); setPhotoPreview(null); setPhotoBase64(null); setDrawerOpen(true); }}>
          Record Baptism
        </Button>
      </Box>

      <Card sx={{ mb: 2, p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField fullWidth size="small" placeholder="Search by member name or certificate number..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                <MenuItem value="">All</MenuItem>
                {['PENDING', 'APPROVED', 'REJECTED'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
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
                    <TableCell sx={{ fontWeight: 700 }}>Member</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Certificate No</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Baptism Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Officiant</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Photo</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {baptisms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        No baptism records yet. Click "Record Baptism" to add one.
                      </TableCell>
                    </TableRow>
                  ) : baptisms.map((b: any) => (
                    <TableRow key={b.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 30, height: 30, bgcolor: '#1a237e', fontSize: '0.7rem' }}>
                            {b.member?.fullname?.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{b.member?.fullname}</Typography>
                            <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>{b.member?.memberNo}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#1a237e', fontWeight: 700 }}>{b.certificateNo}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{new Date(b.baptismDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip label={b.baptismType} size="small" sx={{ fontSize: '0.7rem', bgcolor: '#e3f2fd', color: '#1565c0' }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem' }}>{b.officiantName || '-'}</TableCell>
                      <TableCell>
                        {b.photo ? (
                          <Avatar src={b.photo} sx={{ width: 32, height: 32 }} />
                        ) : (
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#f5f5f5' }}>
                            <ImageIcon sx={{ fontSize: 16, color: '#bbb' }} />
                          </Avatar>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={b.status} size="small"
                          sx={{ fontWeight: 600, fontSize: '0.7rem', bgcolor: STATUS_COLOR[b.status]?.bg, color: STATUS_COLOR[b.status]?.color }} />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          {b.status === 'APPROVED' && (
                            <IconButton size="small" color="primary" title="Download Certificate" onClick={() => handleDownload(b)}>
                              <Download fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton size="small" onClick={(e) => { setAnchorEl(e.currentTarget); setSelected(b); }}>
                            <MoreVert fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                Showing {baptisms.length} of {pagination?.total || 0}
              </Typography>
              <Pagination count={pagination?.totalPages || 1} page={page} onChange={(_, v) => setPage(v)} size="small" color="primary" />
            </Box>
          </>
        )}
      </Card>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        {selected?.status !== 'APPROVED' && (
          <MenuItem onClick={() => handleEdit(selected)}>
            <ListItemIcon><Edit fontSize="small" /></ListItemIcon>Edit
          </MenuItem>
        )}
        {selected?.status === 'PENDING' && (
          <MenuItem onClick={() => { approveMutation.mutate(selected.id); setAnchorEl(null); }}>
            <ListItemIcon><Verified fontSize="small" sx={{ color: '#2e7d32' }} /></ListItemIcon>
            <Typography sx={{ color: '#2e7d32', fontWeight: 600 }}>Approve & Issue Certificate</Typography>
          </MenuItem>
        )}
        {selected?.status === 'PENDING' && (
          <MenuItem onClick={() => { setRejectDialog(true); setAnchorEl(null); }}>
            <ListItemIcon><Cancel fontSize="small" sx={{ color: '#c62828' }} /></ListItemIcon>
            <Typography sx={{ color: '#c62828' }}>Reject</Typography>
          </MenuItem>
        )}
        {selected?.status === 'APPROVED' && (
          <MenuItem onClick={() => { handleDownload(selected); setAnchorEl(null); }}>
            <ListItemIcon><Download fontSize="small" /></ListItemIcon>Download Certificate
          </MenuItem>
        )}
        {selected?.status !== 'APPROVED' && (
          <MenuItem onClick={() => { setDeleteDialog(true); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
            <ListItemIcon><Delete fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>Delete
          </MenuItem>
        )}
      </Menu>

      {/* Add/Edit Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 500 }, p: 3 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', mb: 3 }}>
          {editId ? 'Edit Baptism Record' : 'Record Baptism'}
        </Typography>

        {/* Photo upload */}
        <Box sx={{ mb: 3, p: 2, border: '2px dashed #e0e0e0', borderRadius: 2, textAlign: 'center', cursor: 'pointer', '&:hover': { borderColor: '#1a237e' } }}
          onClick={() => fileInputRef.current?.click()}>
          {photoPreview ? (
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <img src={photoPreview} alt="Preview" style={{ width: 100, height: 120, objectFit: 'cover', borderRadius: 8, border: '2px solid #1a237e' }} />
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 1 }}>Click to change photo</Typography>
            </Box>
          ) : (
            <>
              <ImageIcon sx={{ fontSize: 40, color: '#bbb', mb: 1 }} />
              <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>Upload member photo for certificate</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>JPG/PNG · max 2 MB</Typography>
            </>
          )}
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" hidden onChange={handlePhotoChange} />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Member *</InputLabel>
              <Select value={form.memberId} label="Member *" onChange={(e) => setForm((f) => ({ ...f, memberId: e.target.value }))}>
                <MenuItem value="">Select member</MenuItem>
                {members.map((m: any) => <MenuItem key={m.id} value={m.id}>{m.fullname} ({m.memberNo})</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Baptism Date *" type="date" value={form.baptismDate}
              onChange={(e) => setForm((f) => ({ ...f, baptismDate: e.target.value }))} size="small" InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Baptism Type</InputLabel>
              <Select value={form.baptismType} label="Baptism Type" onChange={(e) => setForm((f) => ({ ...f, baptismType: e.target.value }))}>
                <MenuItem value="WATER">Water Baptism</MenuItem>
                <MenuItem value="HOLY_SPIRIT">Holy Spirit Baptism</MenuItem>
                <MenuItem value="BOTH">Water & Holy Spirit</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Officiant (Pastor)" value={form.officiantName}
              onChange={(e) => setForm((f) => ({ ...f, officiantName: e.target.value }))} size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Venue / Location" value={form.venue}
              onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))} size="small" />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Witnesses (names)" value={form.witnesses}
              onChange={(e) => setForm((f) => ({ ...f, witnesses: e.target.value }))} size="small" />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Notes" multiline rows={2} value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} size="small" />
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ mt: 2, fontSize: '0.8rem' }}>
          The certificate will be available for download once approved by a pastor. Make sure to upload a member photo for the certificate.
        </Alert>

        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button variant="outlined" fullWidth onClick={() => setDrawerOpen(false)}>Cancel</Button>
          <Button variant="contained" fullWidth onClick={() => saveMutation.mutate(form)}
            disabled={saveMutation.isPending || !form.memberId || !form.baptismDate}>
            {saveMutation.isPending ? <CircularProgress size={20} color="inherit" /> : (editId ? 'Update' : 'Record Baptism')}
          </Button>
        </Box>
      </Drawer>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reject Baptism Record</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Reason for rejection" multiline rows={3} value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => rejectMutation.mutate({ id: selected?.id, reason: rejectReason })}>
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Baptism Record</DialogTitle>
        <DialogContent>
          <Typography>Delete baptism record for <strong>{selected?.member?.fullname}</strong>? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => deleteMutation.mutate(selected?.id)} disabled={deleteMutation.isPending}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
