import React, { useState } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, IconButton, Avatar,
  Divider, Menu, MenuItem, Tooltip, Badge, Chip, useMediaQuery, useTheme,
} from '@mui/material';
import {
  Dashboard, People, AttachMoney, Work, Inventory, Church,
  Logout, Menu as MenuIcon, ChevronLeft, Notifications,
  Settings, Person, EventNote, AccountBalance, GroupWork,
  Business, BarChart, HowToReg, Payments,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { RootState } from '../../store';

const DRAWER_WIDTH = 260;

const NAV_SECTIONS = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
      { label: 'Reports', icon: <BarChart />, path: '/reports' },
    ],
  },
  {
    title: 'CONGREGATION',
    items: [
      { label: 'Members', icon: <People />, path: '/members' },
      { label: 'Attendance', icon: <HowToReg />, path: '/attendance' },
      { label: 'Parishes / Branches', icon: <Business />, path: '/parishes' },
      { label: 'Ministries', icon: <GroupWork />, path: '/ministries' },
      { label: 'Events', icon: <EventNote />, path: '/events' },
    ],
  },
  {
    title: 'FINANCE',
    items: [
      { label: 'Donations', icon: <AttachMoney />, path: '/donations' },
      { label: 'Expenses', icon: <AccountBalance />, path: '/accounts' },
    ],
  },
  {
    title: 'ADMINISTRATION',
    items: [
      { label: 'Employees', icon: <Work />, path: '/employees' },
      { label: 'Payroll', icon: <Payments />, path: '/payroll' },
      { label: 'Assets', icon: <Inventory />, path: '/assets' },
      { label: 'Settings', icon: <Settings />, path: '/settings' },
    ],
  },
];

export default function TenantLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const user = useSelector((s: RootState) => s.auth.user);
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const tenantName = user?.tenant?.name || 'My Church';
  const initials = tenantName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2.5, background: 'linear-gradient(135deg,#1a237e,#283593)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Avatar sx={{ bgcolor: '#c8a415', color: '#000', fontWeight: 800 }}>{initials}</Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tenantName}</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>Church Portal</Typography>
          </Box>
        </Box>
        <Chip
          label={user?.tenant?.status || 'ACTIVE'}
          size="small"
          sx={{
            bgcolor: user?.tenant?.status === 'ACTIVE' ? 'rgba(46,125,50,0.3)' : 'rgba(200,164,21,0.3)',
            color: 'white', fontSize: '0.65rem', fontWeight: 600,
          }}
        />
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', py: 1, px: 1 }}>
        {NAV_SECTIONS.map((section) => (
          <Box key={section.title}>
            <Typography sx={{ color: 'text.disabled', fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1.5, px: 2, pt: 2, pb: 0.5 }}>
              {section.title}
            </Typography>
            {section.items.map((item) => {
              const active = location.pathname === item.path;
              return (
                <ListItem key={item.label} disablePadding sx={{ mb: 0.3 }}>
                  <ListItemButton
                    onClick={() => { navigate(item.path); if (isMobile) setDrawerOpen(false); }}
                    sx={{
                      borderRadius: 2, py: 1,
                      bgcolor: active ? 'rgba(26,35,126,0.1)' : 'transparent',
                      color: active ? '#1a237e' : 'text.secondary',
                      '&:hover': { bgcolor: 'rgba(26,35,126,0.07)', color: '#1a237e' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: 'inherit', '& svg': { fontSize: '1.1rem' } }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: active ? 700 : 500, fontSize: '0.875rem' }} />
                    {active && <Box sx={{ width: 3, height: 20, bgcolor: '#1a237e', borderRadius: 1 }} />}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </Box>
        ))}
      </Box>

      <Divider />
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'rgba(26,35,126,0.05)' }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: '#1a237e', fontSize: '0.8rem', fontWeight: 700 }}>
            {user?.fullname?.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.fullname}</Typography>
            <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{user?.role?.replace('_', ' ')}</Typography>
          </Box>
          <IconButton size="small" onClick={handleLogout}><Logout fontSize="small" /></IconButton>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {isMobile ? (
        <Drawer variant="temporary" open={drawerOpen} onClose={() => setDrawerOpen(false)} sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
          {drawer}
        </Drawer>
      ) : (
        <Drawer variant="persistent" anchor="left" open={drawerOpen} sx={{ width: drawerOpen ? DRAWER_WIDTH : 0, flexShrink: 0, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none', boxShadow: '4px 0 24px rgba(0,0,0,0.07)' } }}>
          {drawer}
        </Drawer>
      )}

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid rgba(0,0,0,0.08)', color: 'text.primary' }}>
          <Toolbar sx={{ minHeight: '56px !important' }}>
            <IconButton onClick={() => setDrawerOpen(!drawerOpen)} sx={{ mr: 2 }} size="small">
              {drawerOpen && !isMobile ? <ChevronLeft /> : <MenuIcon />}
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
              <Church sx={{ color: '#1a237e', fontSize: 20 }} />
              <Typography sx={{ fontWeight: 700, color: '#1a237e', fontSize: '0.95rem' }}>{tenantName}</Typography>
            </Box>
            <Tooltip title="Notifications">
              <IconButton size="small">
                <Badge badgeContent={2} color="error"><Notifications fontSize="small" /></Badge>
              </IconButton>
            </Tooltip>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small" sx={{ ml: 1 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#1a237e', fontSize: '0.75rem' }}>
                {user?.fullname?.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
              <MenuItem dense><ListItemIcon><Person fontSize="small" /></ListItemIcon>Profile</MenuItem>
              <MenuItem dense onClick={handleLogout}><ListItemIcon><Logout fontSize="small" /></ListItemIcon>Logout</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
