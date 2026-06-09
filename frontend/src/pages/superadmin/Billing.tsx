import React, { useState } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, Table, TableBody,
  TableCell, TableHead, TableRow, Chip, CircularProgress, Pagination,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CreditCard, Business, CheckCircle, Warning } from '@mui/icons-material';
import api from '../../services/api';

const PLAN_PRICES: Record<string, number> = { STARTER: 29, STANDARD: 79, PROFESSIONAL: 149, ENTERPRISE: 299 };
const PLAN_COLORS: Record<string, string> = { STARTER: '#6a1b9a', STANDARD: '#1a237e', PROFESSIONAL: '#2e7d32', ENTERPRISE: '#c8a415' };
const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: 'rgba(46,125,50,0.1)', color: '#2e7d32' },
  TRIAL: { bg: 'rgba(200,164,21,0.1)', color: '#b87200' },
  SUSPENDED: { bg: 'rgba(198,40,40,0.1)', color: '#c62828' },
  EXPIRED: { bg: 'rgba(0,0,0,0.05)', color: '#616161' },
  PENDING_VERIFICATION: { bg: 'rgba(21,101,192,0.1)', color: '#1565c0' },
};

export default function Billing() {
  const [page, setPage] = useState(1);
  const [planFilter, setPlanFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['tenants-billing', page, planFilter],
    queryFn: () => api.get(`/superadmin/tenants?page=${page}&limit=15&plan=${planFilter}`).then((r) => r.data),
  });

  const tenants = data?.data || [];
  const pagination = data?.pagination;

  const planBreakdown = ['STARTER', 'STANDARD', 'PROFESSIONAL', 'ENTERPRISE'].map((p) => ({
    plan: p,
    count: tenants.filter((t: any) => t.subscriptionPlan === p && t.status === 'ACTIVE').length,
    revenue: tenants.filter((t: any) => t.subscriptionPlan === p && t.status === 'ACTIVE').length * PLAN_PRICES[p],
  }));

  const mrr = planBreakdown.reduce((s, p) => s + p.revenue, 0);
  const activeCount = tenants.filter((t: any) => t.status === 'ACTIVE').length;
  const expiringCount = tenants.filter((t: any) => {
    if (!t.subscriptionExpiresAt) return false;
    const days = Math.ceil((new Date(t.subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days <= 30 && days > 0;
  }).length;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e' }}>Billing & Subscriptions</Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>Subscription tracking and revenue overview</Typography>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'MONTHLY RECURRING REVENUE', value: `$${mrr.toLocaleString()}`, icon: <CreditCard />, color: '#2e7d32', sub: 'USD (active subs)' },
          { label: 'ACTIVE SUBSCRIPTIONS', value: activeCount, icon: <Business />, color: '#1a237e', sub: 'of current page' },
          { label: 'EXPIRING SOON', value: expiringCount, icon: <Warning />, color: '#b87200', sub: 'within 30 days' },
          { label: 'TOTAL TENANTS', value: pagination?.total || 0, icon: <CheckCircle />, color: '#6a1b9a', sub: 'All plans' },
        ].map((s) => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Card sx={{ borderLeft: `4px solid ${s.color}` }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600 }}>{s.label}</Typography>
                  <Box sx={{ width: 34, height: 34, borderRadius: 1.5, bgcolor: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</Box>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: s.color }}>{s.value}</Typography>
                {s.sub && <Typography sx={{ fontSize: '0.73rem', color: 'text.secondary', mt: 0.3 }}>{s.sub}</Typography>}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Plan breakdown chart */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 700, mb: 2 }}>Subscription Plan Distribution</Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={planBreakdown} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="plan" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Active Tenants" radius={[4, 4, 0, 0]}>
                    {planBreakdown.map((e) => <Cell key={e.plan} fill={PLAN_COLORS[e.plan]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 700, mb: 2 }}>Plan Pricing Summary</Typography>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8f9ff' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Plan</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Price/mo</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Active</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>MRR</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {planBreakdown.map((p) => (
                    <TableRow key={p.plan} hover>
                      <TableCell><Chip label={p.plan} size="small" sx={{ bgcolor: `${PLAN_COLORS[p.plan]}15`, color: PLAN_COLORS[p.plan], fontWeight: 600, fontSize: '0.75rem' }} /></TableCell>
                      <TableCell sx={{ textAlign: 'right', fontSize: '0.85rem' }}>${PLAN_PRICES[p.plan]}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontSize: '0.85rem' }}>{p.count}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontWeight: 700, fontSize: '0.85rem', color: '#2e7d32' }}>${p.revenue}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                    <TableCell colSpan={3} sx={{ fontWeight: 800 }}>TOTAL MRR</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontWeight: 800, color: '#2e7d32', fontSize: '0.9rem' }}>${mrr}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tenant subscriptions table */}
      <Card>
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Plan Filter</InputLabel>
            <Select value={planFilter} label="Plan Filter" onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}>
              <MenuItem value="">All Plans</MenuItem>
              {['STARTER', 'STANDARD', 'PROFESSIONAL', 'ENTERPRISE'].map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box> : (
          <>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8f9ff' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Church</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Plan</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Expires</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>MRR Contribution</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tenants.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>No tenants found.</TableCell></TableRow>
                  ) : tenants.map((t: any) => {
                    const daysLeft = t.subscriptionExpiresAt ? Math.ceil((new Date(t.subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                    return (
                      <TableRow key={t.id} hover>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{t.name}</Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{t.email}</Typography>
                        </TableCell>
                        <TableCell><Chip label={t.subscriptionPlan} size="small" sx={{ bgcolor: `${PLAN_COLORS[t.subscriptionPlan]}15`, color: PLAN_COLORS[t.subscriptionPlan], fontWeight: 600, fontSize: '0.72rem' }} /></TableCell>
                        <TableCell><Chip label={t.status} size="small" sx={{ bgcolor: STATUS_COLOR[t.status]?.bg, color: STATUS_COLOR[t.status]?.color, fontWeight: 600, fontSize: '0.72rem' }} /></TableCell>
                        <TableCell sx={{ fontSize: '0.82rem', color: daysLeft !== null && daysLeft <= 30 ? '#c62828' : 'text.secondary' }}>
                          {t.subscriptionExpiresAt ? `${new Date(t.subscriptionExpiresAt).toLocaleDateString()}${daysLeft !== null && daysLeft > 0 && daysLeft <= 30 ? ` (${daysLeft}d left)` : ''}` : '—'}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right', fontWeight: 700, color: t.status === 'ACTIVE' ? '#2e7d32' : 'text.secondary', fontSize: '0.85rem' }}>
                          {t.status === 'ACTIVE' ? `$${PLAN_PRICES[t.subscriptionPlan] || 0}` : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Pagination count={pagination?.totalPages || 1} page={page} onChange={(_, v) => setPage(v)} size="small" color="primary" />
            </Box>
          </>
        )}
      </Card>
    </Box>
  );
}
