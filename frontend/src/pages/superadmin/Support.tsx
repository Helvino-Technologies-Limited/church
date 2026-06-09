import React, { useState } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, TextField, Button,
  Table, TableBody, TableCell, TableHead, TableRow, Chip,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Pagination, FormControl, InputLabel, Select,
  MenuItem, Divider,
} from '@mui/material';
import { Reply, ConfirmationNumber, HourglassEmpty, CheckCircle } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useSnackbar } from 'notistack';

const PRIORITY_COLOR: Record<string, { bg: string; color: string }> = {
  LOW: { bg: 'rgba(0,0,0,0.05)', color: '#616161' },
  MEDIUM: { bg: 'rgba(200,164,21,0.12)', color: '#b87200' },
  HIGH: { bg: 'rgba(230,81,0,0.12)', color: '#e65100' },
  CRITICAL: { bg: 'rgba(198,40,40,0.12)', color: '#c62828' },
};
const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  OPEN: { bg: 'rgba(21,101,192,0.1)', color: '#1565c0' },
  IN_PROGRESS: { bg: 'rgba(200,164,21,0.12)', color: '#b87200' },
  RESOLVED: { bg: 'rgba(46,125,50,0.1)', color: '#2e7d32' },
  CLOSED: { bg: 'rgba(0,0,0,0.05)', color: '#616161' },
};

export default function Support() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [viewDialog, setViewDialog] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['support-tickets', page, statusFilter],
    queryFn: () => api.get(`/superadmin/support?page=${page}&limit=15&status=${statusFilter}`).then((r) => r.data),
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) => api.post(`/superadmin/support/${id}/reply`, { message }),
    onSuccess: () => {
      enqueueSnackbar('Reply sent', { variant: 'success' });
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
    onError: () => enqueueSnackbar('Failed to send reply', { variant: 'error' }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/superadmin/support/${id}/status`, { status }),
    onSuccess: () => {
      enqueueSnackbar('Status updated', { variant: 'success' });
      setStatusDialog(false);
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
    onError: () => enqueueSnackbar('Update failed', { variant: 'error' }),
  });

  const tickets = data?.data || [];
  const pagination = data?.pagination;

  const openCount = tickets.filter((t: any) => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter((t: any) => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter((t: any) => t.status === 'RESOLVED').length;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e' }}>Support Tickets</Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>Manage tenant support requests</Typography>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'OPEN', value: openCount, icon: <ConfirmationNumber />, color: '#1565c0' },
          { label: 'IN PROGRESS', value: inProgressCount, icon: <HourglassEmpty />, color: '#b87200' },
          { label: 'RESOLVED', value: resolvedCount, icon: <CheckCircle />, color: '#2e7d32' },
          { label: 'TOTAL TICKETS', value: pagination?.total || 0, icon: <ConfirmationNumber />, color: '#1a237e' },
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
              {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box> : (
          <>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8f9ff' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Ticket #</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tenant</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tickets.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>No support tickets found.</TableCell></TableRow>
                  ) : tickets.map((t: any) => (
                    <TableRow key={t.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#1a237e' }}>#{t.id?.slice(0, 8).toUpperCase()}</TableCell>
                      <TableCell sx={{ fontSize: '0.83rem' }}>{t.tenant?.name || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500, maxWidth: 220 }}>{t.subject}</TableCell>
                      <TableCell>
                        <Chip label={t.priority || 'MEDIUM'} size="small" sx={{ fontSize: '0.7rem', bgcolor: PRIORITY_COLOR[t.priority || 'MEDIUM']?.bg, color: PRIORITY_COLOR[t.priority || 'MEDIUM']?.color, fontWeight: 600 }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={t.status?.replace('_', ' ')} size="small" sx={{ fontSize: '0.7rem', bgcolor: STATUS_COLOR[t.status || 'OPEN']?.bg, color: STATUS_COLOR[t.status || 'OPEN']?.color, fontWeight: 600 }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell align="center">
                        <Button size="small" variant="outlined" startIcon={<Reply fontSize="small" />} onClick={() => { setSelected(t); setViewDialog(true); }} sx={{ fontSize: '0.75rem' }}>
                          View & Reply
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Pagination count={pagination?.totalPages || 1} page={page} onChange={(_, v) => setPage(v)} size="small" color="primary" />
            </Box>
          </>
        )}
      </Card>

      {/* View & Reply Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 700 }}>Ticket #{selected?.id?.slice(0, 8).toUpperCase()}</Typography>
          <Chip label={selected?.status?.replace('_', ' ')} size="small" sx={{ bgcolor: STATUS_COLOR[selected?.status || 'OPEN']?.bg, color: STATUS_COLOR[selected?.status || 'OPEN']?.color, fontWeight: 600 }} />
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>{selected?.subject}</Typography>
            <Typography sx={{ fontSize: '0.83rem', color: 'text.secondary' }}>From: {selected?.tenant?.name} · {selected?.createdAt ? new Date(selected.createdAt).toLocaleString() : ''}</Typography>
          </Box>
          <Box sx={{ p: 2, bgcolor: '#f8f9ff', borderRadius: 2, mb: 3 }}>
            <Typography sx={{ fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selected?.message}</Typography>
          </Box>

          {selected?.response && (
            <>
              <Divider sx={{ mb: 2 }} />
              <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Admin Response</Typography>
              <Box sx={{ p: 1.5, bgcolor: 'rgba(26,35,126,0.05)', borderRadius: 2, mb: 1.5, borderLeft: '3px solid #1a237e' }}>
                <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mb: 0.5 }}>SuperAdmin</Typography>
                <Typography sx={{ fontSize: '0.88rem' }}>{selected.response}</Typography>
              </Box>
            </>
          )}

          <Divider sx={{ my: 2 }} />
          <Typography sx={{ fontWeight: 600, mb: 1 }}>Reply</Typography>
          <TextField fullWidth multiline rows={3} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type your reply..." size="small" />

          <Box sx={{ mt: 2, display: 'flex', gap: 1.5 }}>
            <Button variant="contained" startIcon={<Reply />} onClick={() => replyMutation.mutate({ id: selected?.id, message: replyText })} disabled={replyMutation.isPending || !replyText.trim()}>
              {replyMutation.isPending ? <CircularProgress size={18} color="inherit" /> : 'Send Reply'}
            </Button>
            <Button variant="outlined" onClick={() => { setNewStatus(selected?.status || 'OPEN'); setStatusDialog(true); }}>Change Status</Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Change Ticket Status</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>New Status</InputLabel>
            <Select value={newStatus} label="New Status" onChange={(e) => setNewStatus(e.target.value)}>
              {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => statusMutation.mutate({ id: selected?.id, status: newStatus })} disabled={statusMutation.isPending}>Update</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
