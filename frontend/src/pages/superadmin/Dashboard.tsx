import React from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, CircularProgress,
  Avatar, Table, TableBody, TableCell, TableHead, TableRow, Paper,
  LinearProgress, Button, List, ListItem, ListItemText, Divider,
} from '@mui/material';
import {
  Business, People, TrendingUp, Warning, CheckCircle, Schedule,
  Block, Refresh, ArrowForward, MonetizationOn,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: '#2e7d32', TRIAL: '#e65100', SUSPENDED: '#c62828',
  EXPIRED: '#616161', PENDING_VERIFICATION: '#1565c0',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  ACTIVE: <CheckCircle sx={{ fontSize: 16 }} />,
  TRIAL: <Schedule sx={{ fontSize: 16 }} />,
  SUSPENDED: <Block sx={{ fontSize: 16 }} />,
  EXPIRED: <Warning sx={{ fontSize: 16 }} />,
  PENDING_VERIFICATION: <Refresh sx={{ fontSize: 16 }} />,
};

function StatCard({ label, value, icon, color, sub }: { label: string; value: string | number; icon: React.ReactNode; color: string; sub?: string }) {
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {label}
          </Typography>
          <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
            {icon}
          </Box>
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 800, color: '#1a237e', lineHeight: 1 }}>{value}</Typography>
        {sub && <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem', mt: 0.5 }}>{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['superadmin-dashboard'],
    queryFn: () => api.get('/superadmin/dashboard').then((r) => r.data.data),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  const { stats, recentTenants = [], tenantStatusCounts = [], tenantsByPlan = [] } = data || {};

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e' }}>Platform Overview</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>Real-time SaaS platform metrics</Typography>
        </Box>
        <Button startIcon={<Refresh />} onClick={() => refetch()} variant="outlined" size="small">Refresh</Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Total Churches" value={stats?.totalTenants || 0} icon={<Business />} color="#1a237e" sub="All registered tenants" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Active Churches" value={stats?.activeTenants || 0} icon={<CheckCircle />} color="#2e7d32" sub={`${stats?.trialTenants || 0} on trial`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Total Members" value={(stats?.totalMembers || 0).toLocaleString()} icon={<People />} color="#6a1b9a" sub="Across all churches" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Platform Users" value={stats?.totalUsers || 0} icon={<TrendingUp />} color="#e65100" sub="Active admin users" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Tenants */}
        <Grid item xs={12} lg={8}>
          <Card>
            <Box sx={{ p: 3, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Recent Churches</Typography>
              <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/superadmin/tenants')}>View All</Button>
            </Box>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Church</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Country</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Plan</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Members</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Registered</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTenants.map((t: any) => (
                    <TableRow
                      key={t.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/superadmin/tenants/${t.id}`)}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: '#1a237e', fontSize: '0.7rem' }}>
                            {t.name.slice(0, 2).toUpperCase()}
                          </Avatar>
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{t.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{t.country}</TableCell>
                      <TableCell>
                        <Chip label={t.subscriptionPlan} size="small" sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={STATUS_ICON[t.status] as any}
                          label={t.status}
                          size="small"
                          sx={{ bgcolor: `${STATUS_COLOR[t.status]}15`, color: STATUS_COLOR[t.status], fontWeight: 600, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{t._count?.members}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                        {new Date(t.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          {/* Status breakdown */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Tenant Status</Typography>
              {tenantStatusCounts.map((s: any) => (
                <Box key={s.status} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>{s.status}</Typography>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>{s.count}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={stats?.totalTenants ? (s.count / stats.totalTenants) * 100 : 0}
                    sx={{ height: 6, borderRadius: 3, bgcolor: `${STATUS_COLOR[s.status]}20`, '& .MuiLinearProgress-bar': { bgcolor: STATUS_COLOR[s.status] } }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* Plans breakdown */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Plans Distribution</Typography>
              {tenantsByPlan.map((p: any) => (
                <Box key={p.subscriptionPlan} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography sx={{ fontSize: '0.85rem' }}>{p.subscriptionPlan}</Typography>
                  <Chip label={p._count.subscriptionPlan} size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(26,35,126,0.1)', color: '#1a237e' }} />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
