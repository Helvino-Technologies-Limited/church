import React, { useState } from 'react';
import {
  Box, Container, Typography, TextField, Button, Card, CardContent,
  Alert, InputAdornment, IconButton, Divider,
  CircularProgress, Paper,
} from '@mui/material';
import {
  Email, Lock, Visibility, VisibilityOff, Church,
  ArrowBack,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from '../services/api';
import { setCredentials } from '../store/slices/authSlice';

const DEMO_ACCOUNT = {
  label: 'Demo Church Account',
  sublabel: 'Grace Community Church',
  email: 'admin@gracechurch.demo',
  password: 'Demo@2024',
  color: '#1a237e',
  icon: <Church fontSize="small" />,
};

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      dispatch(setCredentials({
        user: data.data.user,
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      }));
      const role = data.data.user.role;
      if (role === 'SUPERADMIN') navigate('/superadmin/dashboard');
      else navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail(DEMO_ACCOUNT.email);
    setPassword(DEMO_ACCOUNT.password);
    setError('');
  };

  return (
    <>
    <Helmet>
      <title>Sign In | CMS-360 Church Management</title>
      <meta name="description" content="Sign in to your CMS-360 church management account. Access your church dashboard, members, finance, and more." />
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0d1242 0%, #1a237e 40%, #283593 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background image */}
      <Box
        sx={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=1920&q=60)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.15,
        }}
      />

      {/* Back button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/')}
        sx={{ position: 'absolute', top: 24, left: 24, color: 'rgba(255,255,255,0.8)', '&:hover': { color: 'white' } }}
      >
        Back to Home
      </Button>

      <Container maxWidth="sm" sx={{ position: 'relative', py: 4 }}>
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#c8a415,#fdd54f)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <Church sx={{ color: '#1a237e', fontSize: 32 }} />
          </Box>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>
            CMS-360
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>Church Management Platform</Typography>
        </Box>

        {/* Demo credentials card */}
        <Paper sx={{ p: 2.5, mb: 3, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 3 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, mb: 2, fontSize: '0.9rem', textAlign: 'center' }}>
            ✨ Try our demo — click to auto-fill
          </Typography>
          <Box
            onClick={fillDemo}
            sx={{
              p: 2, borderRadius: 2, cursor: 'pointer',
              border: '1px solid rgba(26,35,126,0.4)',
              background: 'rgba(26,35,126,0.2)',
              transition: 'all 0.2s',
              '&:hover': { background: 'rgba(26,35,126,0.35)', transform: 'scale(1.01)', boxShadow: '0 4px 20px rgba(26,35,126,0.3)' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Box sx={{ color: '#fdd54f' }}><Church fontSize="small" /></Box>
              <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>{DEMO_ACCOUNT.label}</Typography>
              <Box sx={{ ml: 'auto' }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>click to fill</Typography>
              </Box>
            </Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>{DEMO_ACCOUNT.sublabel}</Typography>
            <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Email sx={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }} />
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', fontFamily: 'monospace' }}>{DEMO_ACCOUNT.email}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
              <Lock sx={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }} />
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', fontFamily: 'monospace' }}>••••••••</Typography>
            </Box>
          </Box>
        </Paper>

        {/* Login Form */}
        <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a237e', mb: 0.5 }}>Welcome Back</Typography>
            <Typography sx={{ color: 'text.secondary', mb: 3, fontSize: '0.9rem' }}>
              Sign in to your church account
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{ mb: 2.5 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Email sx={{ color: '#1a237e' }} /></InputAdornment>,
                }}
              />
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Lock sx={{ color: '#1a237e' }} /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ py: 1.5, fontSize: '1rem', fontWeight: 700, background: 'linear-gradient(135deg,#1a237e,#283593)' }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>
            </Box>

            <Divider sx={{ my: 3 }}><Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>OR</Typography></Divider>

            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ color: 'text.secondary', mb: 1, fontSize: '0.9rem' }}>
                Don't have an account?
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/register')}
                sx={{ borderColor: '#1a237e', color: '#1a237e', fontWeight: 600 }}
              >
                Register Your Church — Free Trial
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Typography sx={{ textAlign: 'center', mt: 3, color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
          Powered by Helvino Technologies LTD • 0110421320 • info@helvino.org
        </Typography>
      </Container>
    </Box>
    </>
  );
}
