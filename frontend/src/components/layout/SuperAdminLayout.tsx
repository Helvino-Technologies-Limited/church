import React, { useState } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, IconButton, Avatar,
  Divider, Menu, MenuItem, Tooltip, Badge, Chip,
} from '@mui/material';
import {
  Dashboard, Business, BarChart, History, Logout, Menu as MenuIcon,
  ChevronLeft, AdminPanelSettings, Notifications, Settings, Person,
  TrendingUp, Support, MonetizationOn,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { RootState } from '../../store';

const DRAWER_WIDTH = 260;

const NAV_ITEMS = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/superadmin/dashboard' },
  { label: 'Tenants', icon: <Business />, path: '/superadmin/tenants' },
  { label: 'Analytics', icon: <TrendingUp />, path: '/superadmin/analytics' },
  { label: 'Billing', icon: <MonetizationOn />, path: '/superadmin/billing' },
  { label: 'Audit Logs', icon: <History />, path: '/superadmin/audit-logs' },
  { label: 'Support', icon: <Support />, path: '/superadmin/support' },
  { label: 'Settings', icon: <Settings />, path: '/superadmin/settings' },
];

export default function SuperAdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, background: 'linear-gradient(135deg,#0d1242,#1a237e)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#c8a415,#fdd54f)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AdminPanelSettings sx={{ color: '#1a237e', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography sx={{ color: 'white', fontWeight: 800, lineHeight: 1, fontSize: '1rem', fontFamily: "'Playfair Display', serif" }}>CMS-360</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>Super Admin Portal</Typography>
        </Box>
      </Box>

      <List sx={{ pt: 2, px: 1, flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  py: 1.2,
                  bgcolor: active ? 'rgba(26,35,126,0.12)' : 'transparent',
                  color: active ? '#1a237e' : 'text.secondary',
                  '&:hover': { bgcolor: 'rgba(26,35,126,0.08)', color: '#1a237e' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: active ? 700 : 500, fontSize: '0.9rem' }} />
                {active && <Box sx={{ width: 3, height: 24, bgcolor: '#1a237e', borderRadius: 1 }} />}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'rgba(26,35,126,0.06)' }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: '#b71c1c', fontSize: '0.85rem', fontWeight: 700 }}>SA</Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.fullname}</Typography>
            <Chip label="SuperAdmin" size="small" sx={{ bgcolor: '#b71c1c', color: 'white', fontSize: '0.65rem', height: 18, mt: 0.3 }} />
          </Box>
          <IconButton size="small" onClick={handleLogout} title="Logout">
            <Logout fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Drawer
        variant="persistent"
        anchor="left"
        open={drawerOpen}
        sx={{
          width: drawerOpen ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            border: 'none',
            boxShadow: '4px 0 24px rgba(0,0,0,0.08)',
          },
        }}
      >
        {drawer}
      </Drawer>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', transition: 'margin 0.3s', minWidth: 0 }}>
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid rgba(0,0,0,0.08)', color: 'text.primary' }}>
          <Toolbar>
            <IconButton onClick={() => setDrawerOpen(!drawerOpen)} sx={{ mr: 2 }}>
              {drawerOpen ? <ChevronLeft /> : <MenuIcon />}
            </IconButton>
            <Typography sx={{ fontWeight: 700, color: '#1a237e', flex: 1 }}>
              {NAV_ITEMS.find((n) => n.path === location.pathname)?.label || 'SuperAdmin'}
            </Typography>
            <Tooltip title="Notifications">
              <IconButton>
                <Badge badgeContent={3} color="error"><Notifications /></Badge>
              </IconButton>
            </Tooltip>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: '#b71c1c', fontSize: '0.85rem' }}>SA</Avatar>
            </IconButton>
            <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
              <MenuItem onClick={() => { setAnchorEl(null); }}>
                <ListItemIcon><Person fontSize="small" /></ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
