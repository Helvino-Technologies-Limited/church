import React, { useState } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, CircularProgress,
  Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';
import { Group, Business, TrendingUp, Public } from '@mui/icons-material';
import api from '../../services/api';

const PLAN_COLORS: Record<string, string> = { STARTER: '#6a1b9a', STANDARD: '#1a237e', PROFESSIONAL: '#2e7d32', ENTERPRISE: '#c8a415' };
const STATUS_COLORS: Record<string, string> = { ACTIVE: '#2e7d32', SUSPENDED: '#c62828', TRIAL: '#b87200', PENDING_VERIFICATION: '#1565c0', EXPIRED: '#616161' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function StatCard({ label, value, icon, color, sub }: any) {
  return (
    <Card sx={{ borderLeft: `4px solid ${color}` }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem', fontWeight: 600 }}>{label}</Typography>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</Box>
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 800, color }}>{value}</Typography>
        {sub && <Typography sx={{ fontSize: '0.77rem', color: 'text.secondary', mt: 0.3 }}>{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { data, isLoading } = useQuery({
    queryKey: ['superadmin-analytics', year],
    queryFn: () => api.get(`/superadmin/analytics?year=${year}`).then((r) => r.data.data),
  });

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>;

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const totalTenants = Number(kpis.totalTenants || 0);
  const activeTenants = (charts.statusBreakdown || []).find((s: any) => s.status === 'ACTIVE')?._count || 0;
  const totalUsers = Number(kpis.totalUsers || 0);

  const planDistribution = (charts.planDistribution || []).map((p: any) => ({ name: p.subscriptionPlan, value: p._count }));
  const statusDistribution = (charts.statusBreakdown || []).map((s: any) => ({ name: s.status, value: s._count }));

  const monthlyGrowth = MONTHS.map((month, i) => {
    const found = (charts.tenantGrowth || []).find((d: any) => Number(d.month) === i + 1);
    return { month, tenants: found ? Number(found.count) : 0 };
  });

  const newThisMonth = monthlyGrowth.find((m) => m.month === MONTHS[new Date().getMonth()])?.tenants || 0;
  const countryData = (charts.countryDistribution || []).slice(0, 8);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e' }}>Platform Analytics</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>CMS-360 SaaS — platform-wide metrics</Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Year</InputLabel>
          <Select value={year} label="Year" onChange={(e) => setYear(Number(e.target.value))}>
            {[currentYear, currentYear - 1].map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard label="TOTAL TENANTS" value={totalTenants} icon={<Business />} color="#1a237e" sub="All time" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="ACTIVE TENANTS" value={activeTenants} icon={<Business />} color="#2e7d32" sub={`${totalTenants > 0 ? Math.round((activeTenants / totalTenants) * 100) : 0}% of total`} /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="TOTAL USERS" value={totalUsers} icon={<Group />} color="#6a1b9a" sub="Across all tenants" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="NEW THIS MONTH" value={newThisMonth} icon={<TrendingUp />} color="#c8a415" sub="New tenants" /></Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 700, mb: 2 }}>Tenant Growth ({year})</Typography>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={monthlyGrowth}>
                  <defs>
                    <linearGradient id="tenantGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1a237e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1a237e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip formatter={(v) => [v, 'New Tenants']} />
                  <Area type="monotone" dataKey="tenants" name="New Tenants" stroke="#1a237e" fill="url(#tenantGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 700, mb: 2 }}>By Plan</Typography>
              {planDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={planDistribution} cx="50%" cy="50%" outerRadius={75} paddingAngle={3} dataKey="value" label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {planDistribution.map((e: any) => <Cell key={e.name} fill={PLAN_COLORS[e.name] || '#666'} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <Typography sx={{ color: 'text.secondary', textAlign: 'center', pt: 4 }}>No data</Typography>}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 700, mb: 2 }}>By Status</Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusDistribution} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" name="Tenants" radius={[4, 4, 0, 0]}>
                    {statusDistribution.map((e: any) => <Cell key={e.name} fill={STATUS_COLORS[e.name] || '#999'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {countryData.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontWeight: 700, mb: 2 }}>Top Countries</Typography>
                {countryData.map((c: any, i: number) => {
                  const count = c._count?.country || c._count || 0;
                  return (
                    <Box key={c.country || i} sx={{ mb: 1.2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <Public sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography sx={{ fontSize: '0.84rem' }}>{c.country || 'Unknown'}</Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.84rem', fontWeight: 700 }}>{count}</Typography>
                      </Box>
                      <Box sx={{ height: 6, bgcolor: 'rgba(0,0,0,0.06)', borderRadius: 3 }}>
                        <Box sx={{ height: '100%', bgcolor: '#1a237e', borderRadius: 3, width: `${Math.min(totalTenants > 0 ? (count / totalTenants) * 100 : 0, 100)}%` }} />
                      </Box>
                    </Box>
                  );
                })}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
