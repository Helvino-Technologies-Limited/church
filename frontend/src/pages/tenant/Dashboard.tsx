import React from 'react';
import {
  Box, Grid, Card, CardContent, Typography, CircularProgress,
  Avatar, Chip, Divider, List, ListItem, ListItemAvatar,
  ListItemText, Button, Alert,
} from '@mui/material';
import {
  People, AttachMoney, Work, Inventory, TrendingUp,
  PersonAdd, ArrowForward, Church,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#1a237e', '#c8a415', '#2e7d32', '#b71c1c', '#6a1b9a'];

function StatCard({ label, value, icon, color, trend, onClick }: any) {
  return (
    <Card
      sx={{ cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.2s', '&:hover': onClick ? { transform: 'translateY(-2px)' } : {} }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
            {icon}
          </Box>
          {trend && <Chip label={`+${trend}%`} size="small" sx={{ bgcolor: 'rgba(46,125,50,0.1)', color: '#2e7d32', fontWeight: 700, fontSize: '0.7rem' }} />}
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a237e', lineHeight: 1 }}>{value}</Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', mt: 0.5 }}>{label}</Typography>
      </CardContent>
    </Card>
  );
}

export default function TenantDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['tenant-dashboard'],
    queryFn: () => api.get('/tenant/dashboard').then((r) => r.data.data),
    refetchInterval: 60000,
  });

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}><CircularProgress size={48} /></Box>;

  const { stats, recentMembers = [], recentDonations = [], membersByGender = [], donationsByCategory = [], tenant } = data || {};

  const genderChartData = membersByGender.map((g: any) => ({
    name: g.gender || 'Unknown',
    value: g._count.gender,
  }));

  const donationChartData = donationsByCategory.slice(0, 6).map((d: any) => ({
    name: d.category || 'Uncategorized',
    amount: Number(d._sum.amount || 0),
  }));

  const isTrialExpiringSoon = tenant?.trialEndsAt && new Date(tenant.trialEndsAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <Box>
      {isTrialExpiringSoon && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          Your trial expires on <strong>{new Date(tenant.trialEndsAt).toLocaleDateString()}</strong>. Upgrade to continue using CMS-360.
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e' }}>
            Welcome back! 👋
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>
        <Chip
          label={tenant?.subscriptionPlan}
          sx={{ bgcolor: 'rgba(26,35,126,0.1)', color: '#1a237e', fontWeight: 700 }}
        />
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <StatCard label="Total Members" value={(stats?.totalMembers || 0).toLocaleString()} icon={<People />} color="#1a237e" trend={5} onClick={() => navigate('/members')} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Active Members" value={(stats?.activeMembers || 0).toLocaleString()} icon={<TrendingUp />} color="#2e7d32" onClick={() => navigate('/members')} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Total Donations" value={`KES ${Number(stats?.totalDonations || 0).toLocaleString()}`} icon={<AttachMoney />} color="#c8a415" onClick={() => navigate('/donations')} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Employees" value={stats?.totalEmployees || 0} icon={<Work />} color="#6a1b9a" onClick={() => navigate('/employees')} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Members */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <Box sx={{ p: 2.5, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 700 }}>Recent Members</Typography>
              <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/members')}>View All</Button>
            </Box>
            <List dense sx={{ px: 1 }}>
              {recentMembers.map((m: any) => (
                <ListItem key={m.id} sx={{ borderRadius: 2, '&:hover': { bgcolor: 'rgba(26,35,126,0.04)' } }}>
                  <ListItemAvatar>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: '#1a237e', fontSize: '0.8rem', fontWeight: 700 }}>
                      {m.fullname.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={m.fullname}
                    secondary={m.memberNo}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                  <Chip
                    label={m.status}
                    size="small"
                    sx={{ fontSize: '0.65rem', bgcolor: m.status === 'ACTIVE' ? 'rgba(46,125,50,0.1)' : 'rgba(0,0,0,0.05)', color: m.status === 'ACTIVE' ? '#2e7d32' : 'text.secondary' }}
                  />
                </ListItem>
              ))}
            </List>
            <Box sx={{ p: 2, pt: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PersonAdd />}
                onClick={() => navigate('/members?new=1')}
                size="small"
              >
                Add New Member
              </Button>
            </Box>
          </Card>
        </Grid>

        {/* Gender Chart */}
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, mb: 2 }}>Member Gender</Typography>
              {genderChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={genderChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                      {genderChartData.map((_: any, index: number) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RTooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>No data yet</Typography>
                </Box>
              )}
              <Box sx={{ mt: 1 }}>
                {genderChartData.map((g: any, i: number) => (
                  <Box key={g.name} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: COLORS[i % COLORS.length] }} />
                    <Typography sx={{ fontSize: '0.8rem' }}>{g.name}: <strong>{g.value}</strong></Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Donations */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <Box sx={{ p: 2.5, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 700 }}>Recent Donations</Typography>
              <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/donations')}>View All</Button>
            </Box>
            <List dense sx={{ px: 1 }}>
              {recentDonations.map((d: any) => (
                <ListItem key={d.id} sx={{ borderRadius: 2, '&:hover': { bgcolor: 'rgba(26,35,126,0.04)' } }}>
                  <ListItemAvatar>
                    <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(200,164,21,0.15)', color: '#937500', fontSize: '0.7rem' }}>
                      <AttachMoney fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={d.memberName || 'Anonymous'}
                    secondary={d.category || 'General'}
                    primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: 600 }}
                    secondaryTypographyProps={{ fontSize: '0.72rem' }}
                  />
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#2e7d32' }}>
                      KES {Number(d.amount).toLocaleString()}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                      {new Date(d.donatedAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          </Card>
        </Grid>

        {/* Donation by Category Chart */}
        {donationChartData.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontWeight: 700, mb: 2 }}>Donations by Category</Typography>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={donationChartData} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                    <RTooltip formatter={(v: number) => [`KES ${v.toLocaleString()}`, 'Amount']} />
                    <Bar dataKey="amount" fill="#1a237e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
