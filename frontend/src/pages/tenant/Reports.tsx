import React, { useState } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, Select, MenuItem,
  FormControl, InputLabel, CircularProgress, Divider, Tab, Tabs,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';
import { TrendingUp, Group, AttachMoney, Event } from '@mui/icons-material';
import api from '../../services/api';

const COLORS = ['#1a237e', '#c8a415', '#2e7d32', '#b71c1c', '#6a1b9a', '#0277bd'];
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

function TabPanel({ value, index, children }: any) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

export default function Reports() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [tab, setTab] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['reports-summary', year],
    queryFn: () => api.get(`/tenant/reports/summary?year=${year}`).then((r) => r.data.data),
  });

  const { data: memberData } = useQuery({
    queryKey: ['reports-members'],
    queryFn: () => api.get('/tenant/reports/members').then((r) => r.data.data),
  });

  const { data: financeData } = useQuery({
    queryKey: ['reports-finance', year],
    queryFn: () => api.get(`/tenant/reports/finance?year=${year}`).then((r) => r.data.data),
  });

  const monthlyDonations = MONTHS.map((month, i) => {
    const found = data?.monthlyDonations?.find((d: any) => Number(d.month) === i + 1);
    return { month, amount: found ? Number(found.total) : 0 };
  });

  const monthlyExpenses = MONTHS.map((month, i) => {
    const found = data?.monthlyExpenses?.find((d: any) => Number(d.month) === i + 1);
    return { month, expenses: found ? Number(found.total) : 0 };
  });

  const monthlyNet = monthlyDonations.map((d, i) => ({
    month: d.month,
    income: d.amount,
    expenses: monthlyExpenses[i].expenses,
    net: d.amount - monthlyExpenses[i].expenses,
  }));

  const memberGrowth = MONTHS.map((month, i) => {
    const found = data?.memberGrowth?.find((d: any) => Number(d.month) === i + 1);
    return { month, newMembers: found ? Number(found.count) : 0 };
  });

  const attendanceData = MONTHS.map((month, i) => {
    const found = data?.attendanceByMonth?.find((d: any) => Number(d.month) === i + 1);
    return { month, total: found ? Number(found.total) : 0 };
  });

  const totalIncome = Number(financeData?.totalIncome || 0);
  const totalExpenses = Number(financeData?.totalExpenses || 0);
  const netBalance = totalIncome - totalExpenses;

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e' }}>Reports & Analytics</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>Church performance overview</Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Year</InputLabel>
          <Select value={year} label="Year" onChange={(e) => setYear(Number(e.target.value))}>
            {[currentYear, currentYear - 1, currentYear - 2].map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="TOTAL MEMBERS" value={memberData?.total || 0} icon={<Group />} color="#1a237e" sub="Active members" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="TOTAL INCOME" value={`KES ${totalIncome.toLocaleString()}`} icon={<TrendingUp />} color="#2e7d32" sub={`FY ${year}`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="TOTAL EXPENSES" value={`KES ${totalExpenses.toLocaleString()}`} icon={<AttachMoney />} color="#c62828" sub={`FY ${year}`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="NET BALANCE" value={`KES ${Math.abs(netBalance).toLocaleString()}`} icon={<AttachMoney />} color={netBalance >= 0 ? '#2e7d32' : '#c62828'} sub={netBalance >= 0 ? 'Surplus' : 'Deficit'} />
        </Grid>
      </Grid>

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <Tab label="Finance" />
          <Tab label="Members" />
          <Tab label="Attendance" />
        </Tabs>

        {/* Finance Tab */}
        <TabPanel value={tab} index={0}>
          <Box sx={{ px: 3, pb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography sx={{ fontWeight: 700, mb: 2 }}>Monthly Income vs Expenses ({year})</Typography>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthlyNet} barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(v: number) => [`KES ${v.toLocaleString()}`, '']} />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="#2e7d32" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#c62828" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                {financeData?.donationByCategory?.length > 0 && (
                  <>
                    <Typography sx={{ fontWeight: 700, mb: 2 }}>Income by Category</Typography>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={financeData.donationByCategory.map((d: any) => ({ name: d.category || 'General', value: Number(d._sum?.amount || 0) }))} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {financeData.donationByCategory.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => [`KES ${Number(v).toLocaleString()}`, '']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                {financeData?.expenseByCategory?.length > 0 && (
                  <>
                    <Typography sx={{ fontWeight: 700, mb: 2 }}>Expenses by Category</Typography>
                    <Box>
                      {financeData.expenseByCategory.slice(0, 7).map((c: any, i: number) => (
                        <Box key={c.category} sx={{ mb: 1.2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                            <Typography sx={{ fontSize: '0.83rem' }}>{c.category || 'Other'}</Typography>
                            <Typography sx={{ fontSize: '0.83rem', fontWeight: 700 }}>KES {Number(c._sum?.amount || 0).toLocaleString()}</Typography>
                          </Box>
                          <Box sx={{ height: 7, bgcolor: 'rgba(0,0,0,0.06)', borderRadius: 4 }}>
                            <Box sx={{ height: '100%', bgcolor: COLORS[i % COLORS.length], borderRadius: 4, width: `${Math.min(totalExpenses > 0 ? (Number(c._sum?.amount || 0) / totalExpenses) * 100 : 0, 100)}%` }} />
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </>
                )}
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Members Tab */}
        <TabPanel value={tab} index={1}>
          <Box sx={{ px: 3, pb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography sx={{ fontWeight: 700, mb: 2 }}>New Member Registrations ({year})</Typography>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={memberGrowth}>
                    <defs>
                      <linearGradient id="memberGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1a237e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1a237e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="newMembers" name="New Members" stroke="#1a237e" fill="url(#memberGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </Grid>
              <Grid item xs={12} md={3}>
                {memberData?.byStatus?.length > 0 && (
                  <>
                    <Typography sx={{ fontWeight: 700, mb: 2 }}>By Status</Typography>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={memberData.byStatus.map((s: any) => ({ name: s.status, value: s._count._all }))} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                          {memberData.byStatus.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: '0.78rem' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </>
                )}
              </Grid>
              <Grid item xs={12} md={3}>
                {memberData?.byGender?.length > 0 && (
                  <>
                    <Typography sx={{ fontWeight: 700, mb: 2 }}>By Gender</Typography>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={memberData.byGender.map((g: any) => ({ name: g.gender, value: g._count._all }))} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                          {memberData.byGender.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: '0.78rem' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </>
                )}
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Attendance Tab */}
        <TabPanel value={tab} index={2}>
          <Box sx={{ px: 3, pb: 3 }}>
            <Typography sx={{ fontWeight: 700, mb: 2 }}>Monthly Attendance ({year})</Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={attendanceData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip formatter={(v: number) => [v, 'Total Attendance']} />
                <Bar dataKey="total" name="Attendance" fill="#1a237e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {attendanceData.every((d) => d.total === 0) && (
              <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 2 }}>No attendance records for {year}. Start recording Sunday services.</Typography>
            )}
          </Box>
        </TabPanel>
      </Card>
    </Box>
  );
}
