import { Box, Typography, Paper, Grid, Button, Divider } from '@mui/material';
import { Lock, PhoneAndroid, Email, Phone, CheckCircle } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

export default function TrialExpiredScreen({ tenantName }: { tenantName?: string }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg,#0d1242 0%,#1a237e 50%,#283593 100%)',
        p: 3,
      }}
    >
      <Paper sx={{ maxWidth: 620, width: '100%', borderRadius: 4, overflow: 'hidden', boxShadow: 24 }}>
        {/* Header */}
        <Box sx={{ bgcolor: '#b71c1c', p: 3, textAlign: 'center' }}>
          <Lock sx={{ fontSize: 48, color: 'white', mb: 1 }} />
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 800 }}>
            Trial Period Expired
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5, fontSize: '0.9rem' }}>
            {tenantName ? `${tenantName}'s` : 'Your'} 5-day free trial has ended
          </Typography>
        </Box>

        <Box sx={{ p: 4 }}>
          <Typography sx={{ color: 'text.secondary', mb: 3, textAlign: 'center', fontSize: '0.95rem' }}>
            To continue using CMS-360, please make the activation payment below and notify us with your receipt.
          </Typography>

          {/* Pricing */}
          <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 3, borderColor: '#1a237e', bgcolor: '#f8f9ff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontWeight: 700, color: '#1a237e', fontSize: '1.1rem' }}>Activation Fee</Typography>
              <Typography sx={{ fontWeight: 900, fontSize: '1.6rem', color: '#1a237e' }}>KES 50,000</Typography>
            </Box>
            <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', mb: 2 }}>First year — all modules, unlimited members</Typography>
            {['Member & Attendance Management', 'Finance & Donations Tracking', 'Payroll & HR Module', 'Baptism Certificates & Reports', 'Multi-Branch Support'].map((f) => (
              <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.6 }}>
                <CheckCircle sx={{ fontSize: 16, color: '#2e7d32' }} />
                <Typography sx={{ fontSize: '0.85rem' }}>{f}</Typography>
              </Box>
            ))}
          </Paper>

          {/* M-Pesa payment */}
          <Box sx={{ bgcolor: '#1a237e', borderRadius: 3, p: 2.5, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <PhoneAndroid sx={{ color: '#fdd54f' }} />
              <Typography sx={{ color: 'white', fontWeight: 700 }}>Pay via M-Pesa</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2, p: 1.5, textAlign: 'center' }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Paybill</Typography>
                  <Typography sx={{ color: '#fdd54f', fontWeight: 900, fontSize: '1.5rem', fontFamily: 'monospace' }}>522533</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2, p: 1.5, textAlign: 'center' }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Account</Typography>
                  <Typography sx={{ color: '#fdd54f', fontWeight: 900, fontSize: '1.5rem', fontFamily: 'monospace' }}>8071524</Typography>
                </Box>
              </Grid>
            </Grid>
            <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', mt: 1.5, textAlign: 'center' }}>
              Use your church name as payment reference
            </Typography>
          </Box>

          {/* Contact */}
          <Divider sx={{ mb: 2 }} />
          <Typography sx={{ fontWeight: 600, mb: 1.5, fontSize: '0.9rem' }}>After payment, contact us to activate:</Typography>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email sx={{ fontSize: 18, color: '#1a237e' }} />
                <Typography sx={{ fontSize: '0.82rem' }}>info@helvino.org</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone sx={{ fontSize: 18, color: '#1a237e' }} />
                <Typography sx={{ fontSize: '0.82rem' }}>0110 421 320</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone sx={{ fontSize: 18, color: '#1a237e' }} />
                <Typography sx={{ fontSize: '0.82rem' }}>helvinotechltd@gmail.com</Typography>
              </Box>
            </Grid>
          </Grid>

          <Button variant="outlined" fullWidth sx={{ mt: 3 }} onClick={handleLogout}>
            Log Out
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
