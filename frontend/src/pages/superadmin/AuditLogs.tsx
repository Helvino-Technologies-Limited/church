import React, { useState } from 'react';
import {
  Box, Card, Typography, TextField, InputAdornment, Table, TableBody,
  TableCell, TableHead, TableRow, Chip, CircularProgress, Pagination,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  CREATE: { bg: 'rgba(46,125,50,0.1)', color: '#2e7d32' },
  UPDATE: { bg: 'rgba(26,35,126,0.1)', color: '#1a237e' },
  DELETE: { bg: 'rgba(198,40,40,0.1)', color: '#c62828' },
  LOGIN: { bg: 'rgba(21,101,192,0.1)', color: '#1565c0' },
  LOGOUT: { bg: 'rgba(0,0,0,0.05)', color: '#616161' },
  IMPERSONATE: { bg: 'rgba(106,27,154,0.1)', color: '#6a1b9a' },
};

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['superadmin-audit', page, search, action],
    queryFn: () => api.get(`/superadmin/audit-logs?page=${page}&limit=20&search=${search}&action=${action}`).then((r) => r.data),
  });

  const logs = data?.data || [];
  const pagination = data?.pagination;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e' }}>Audit Logs</Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>Platform-wide activity history</Typography>
      </Box>

      <Card>
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <TextField placeholder="Search by user, email, entity..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} size="small" sx={{ flex: 1, minWidth: 220 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }} />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Action</InputLabel>
            <Select value={action} label="Action" onChange={(e) => { setAction(e.target.value); setPage(1); }}>
              <MenuItem value="">All Actions</MenuItem>
              {['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'IMPERSONATE'].map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box> : (
          <>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8f9ff' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tenant</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Entity</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Details</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>IP</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>No audit logs found.</TableCell></TableRow>
                  ) : logs.map((log: any) => (
                    <TableRow key={log.id} hover>
                      <TableCell sx={{ fontSize: '0.78rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleString()}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem' }}>{log.tenant?.name || <em style={{ color: '#999' }}>System</em>}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem' }}>{log.user?.fullName || log.user?.email || 'System'}</TableCell>
                      <TableCell>
                        <Chip label={log.action} size="small" sx={{ fontSize: '0.68rem', fontWeight: 600, bgcolor: ACTION_COLORS[log.action]?.bg || 'rgba(0,0,0,0.05)', color: ACTION_COLORS[log.action]?.color || '#616161', fontFamily: 'monospace' }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem' }}>{log.entity || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.78rem', color: 'text.secondary', maxWidth: 200 }}>{typeof log.details === 'object' ? JSON.stringify(log.details).slice(0, 80) : String(log.details || '-').slice(0, 80)}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', fontFamily: 'monospace' }}>{log.ipAddress || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>Showing {logs.length} of {pagination?.total || 0}</Typography>
              <Pagination count={pagination?.totalPages || 1} page={page} onChange={(_, v) => setPage(v)} size="small" color="primary" />
            </Box>
          </>
        )}
      </Card>
    </Box>
  );
}
