import React, { useState } from 'react';
import {
  Box, Container, Typography, TextField, Button, Card, CardContent,
  Stepper, Step, StepLabel, Grid, MenuItem, Alert, CircularProgress,
  InputAdornment, Chip, Paper, RadioGroup, FormControlLabel, Radio,
} from '@mui/material';
import { Church, Person, ArrowForward, ArrowBack, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const STEPS = ['Church Information', 'Administrator Account', 'Choose Plan'];

const CHURCH_TYPES = ['Single Church', 'Multi-Branch Church', 'Diocese', 'Church Network', 'Ministry', 'Faith-Based Organization', 'International Church'];
const CHURCH_SIZES = [
  { value: 'MICRO', label: 'Micro (< 50 members)' },
  { value: 'SMALL', label: 'Small (50–200 members)' },
  { value: 'MEDIUM', label: 'Medium (200–500 members)' },
  { value: 'LARGE', label: 'Large (500–2000 members)' },
  { value: 'MEGA', label: 'Mega (2000+ members)' },
];
const PLANS = [
  { value: 'STARTER', label: 'Starter', price: 'KES 1,500/mo', desc: 'Single church, up to 200 members, basic reports' },
  { value: 'STANDARD', label: 'Standard', price: 'KES 3,500/mo', desc: 'Multi-branch, unlimited members, HR & Finance' },
  { value: 'PROFESSIONAL', label: 'Professional', price: 'KES 7,500/mo', desc: 'Full ERP, payroll, asset management, API access' },
  { value: 'ENTERPRISE', label: 'Enterprise', price: 'Custom', desc: 'Diocese management, custom branding, dedicated support' },
];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    churchName: '', email: '', phone: '', country: 'Kenya', city: '', state: '',
    address: '', website: '', churchType: '', churchSize: '', numberOfBranches: 1,
    registrationNumber: '',
    adminFullname: '', adminEmail: '', adminPhone: '', adminPassword: '', confirmPassword: '',
    plan: 'STANDARD',
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleNext = () => {
    if (step === 0) {
      if (!form.churchName || !form.email || !form.phone) { setError('Church name, email, and phone are required.'); return; }
    }
    if (step === 1) {
      if (!form.adminFullname || !form.adminEmail || !form.adminPassword) { setError('All admin fields are required.'); return; }
      if (form.adminPassword !== form.confirmPassword) { setError('Passwords do not match.'); return; }
      if (form.adminPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    }
    setError('');
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', {
        churchName: form.churchName, email: form.email, phone: form.phone,
        country: form.country, city: form.city, state: form.state, address: form.address,
        website: form.website, churchType: form.churchType, churchSize: form.churchSize,
        numberOfBranches: Number(form.numberOfBranches), registrationNumber: form.registrationNumber,
        adminFullname: form.adminFullname, adminEmail: form.adminEmail, adminPhone: form.adminPhone,
        adminPassword: form.adminPassword, plan: form.plan,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg,#0d1242,#1a237e)' }}>
        <Container maxWidth="sm">
          <Card sx={{ borderRadius: 4, textAlign: 'center', p: 4 }}>
            <CheckCircle sx={{ fontSize: 72, color: '#2e7d32', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a237e', mb: 2 }}>Registration Successful!</Typography>
            <Typography sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.8 }}>
              <strong>{form.churchName}</strong> has been registered successfully! Your 30-day free trial has started. You can now log in with your administrator credentials.
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', mb: 1 }}>Login Email: <strong>{form.adminEmail}</strong></Typography>
            <Button variant="contained" size="large" onClick={() => navigate('/login')} sx={{ mt: 3, px: 5, py: 1.5, fontWeight: 700 }} endIcon={<ArrowForward />}>
              Go to Login
            </Button>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0d1242,#1a237e)', py: 6 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/')} sx={{ position: 'absolute', top: 24, left: 24, color: 'rgba(255,255,255,0.8)' }}>
        Back
      </Button>

      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#c8a415,#fdd54f)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <Church sx={{ color: '#1a237e', fontSize: 28 }} />
          </Box>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>Register Your Church</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>30-Day Free Trial — No credit card required</Typography>
        </Box>

        <Paper sx={{ p: { xs: 2, md: 4 }, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, mb: 3 }}>
          <Stepper activeStep={step} sx={{ '& .MuiStepLabel-label': { color: 'rgba(255,255,255,0.7)' }, '& .MuiStepLabel-label.Mui-active': { color: '#fdd54f' }, '& .MuiStepLabel-label.Mui-completed': { color: 'rgba(255,255,255,0.9)' } }}>
            {STEPS.map((label) => (
              <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
          </Stepper>
        </Paper>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* Step 0: Church Info */}
            {step === 0 && (
              <Grid container spacing={2.5}>
                <Grid item xs={12}><Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', mb: 1 }}>Church Information</Typography></Grid>
                <Grid item xs={12} md={6}><TextField fullWidth label="Church Name *" value={form.churchName} onChange={set('churchName')} /></Grid>
                <Grid item xs={12} md={6}><TextField fullWidth label="Church Email *" type="email" value={form.email} onChange={set('email')} /></Grid>
                <Grid item xs={12} md={6}><TextField fullWidth label="Phone Number *" value={form.phone} onChange={set('phone')} /></Grid>
                <Grid item xs={12} md={6}><TextField fullWidth label="Website" value={form.website} onChange={set('website')} /></Grid>
                <Grid item xs={12} md={6}>
                  <TextField select fullWidth label="Church Type" value={form.churchType} onChange={set('churchType')}>
                    {CHURCH_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField select fullWidth label="Church Size" value={form.churchSize} onChange={set('churchSize')}>
                    {CHURCH_SIZES.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}><TextField fullWidth label="City" value={form.city} onChange={set('city')} /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth label="County / State" value={form.state} onChange={set('state')} /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth label="Country" value={form.country} onChange={set('country')} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Address" multiline rows={2} value={form.address} onChange={set('address')} /></Grid>
                <Grid item xs={12} md={6}><TextField fullWidth type="number" label="Number of Branches" value={form.numberOfBranches} onChange={set('numberOfBranches')} inputProps={{ min: 1 }} /></Grid>
                <Grid item xs={12} md={6}><TextField fullWidth label="Registration Number (optional)" value={form.registrationNumber} onChange={set('registrationNumber')} /></Grid>
              </Grid>
            )}

            {/* Step 1: Admin Account */}
            {step === 1 && (
              <Grid container spacing={2.5}>
                <Grid item xs={12}><Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', mb: 1 }}>Administrator Account</Typography></Grid>
                <Grid item xs={12} md={6}><TextField fullWidth label="Full Name *" value={form.adminFullname} onChange={set('adminFullname')} /></Grid>
                <Grid item xs={12} md={6}><TextField fullWidth label="Admin Phone" value={form.adminPhone} onChange={set('adminPhone')} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Admin Email *" type="email" value={form.adminEmail} onChange={set('adminEmail')} /></Grid>
                <Grid item xs={12} md={6}><TextField fullWidth label="Password *" type="password" value={form.adminPassword} onChange={set('adminPassword')} helperText="Minimum 8 characters" /></Grid>
                <Grid item xs={12} md={6}><TextField fullWidth label="Confirm Password *" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} /></Grid>
              </Grid>
            )}

            {/* Step 2: Plan */}
            {step === 2 && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', mb: 3 }}>Choose Your Plan</Typography>
                <RadioGroup value={form.plan} onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}>
                  <Grid container spacing={2}>
                    {PLANS.map((plan) => (
                      <Grid item xs={12} sm={6} key={plan.value}>
                        <Paper
                          onClick={() => setForm((f) => ({ ...f, plan: plan.value }))}
                          sx={{
                            p: 2.5, borderRadius: 2, cursor: 'pointer', border: '2px solid',
                            borderColor: form.plan === plan.value ? '#1a237e' : 'rgba(0,0,0,0.1)',
                            background: form.plan === plan.value ? 'rgba(26,35,126,0.05)' : 'white',
                            transition: 'all 0.2s',
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography sx={{ fontWeight: 700, color: '#1a237e' }}>{plan.label}</Typography>
                            <Chip label={plan.price} size="small" sx={{ bgcolor: form.plan === plan.value ? '#1a237e' : '#f5f5f5', color: form.plan === plan.value ? 'white' : 'inherit', fontWeight: 600 }} />
                          </Box>
                          <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{plan.desc}</Typography>
                          <FormControlLabel value={plan.value} control={<Radio size="small" />} label="" sx={{ mt: 1, ml: 0 }} />
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </RadioGroup>
                <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
                  <strong>30-Day Free Trial</strong> — Start with any plan. No payment required during the trial period. You can upgrade or downgrade anytime.
                </Alert>
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
              <Button variant="outlined" onClick={() => step > 0 ? setStep(step - 1) : navigate('/')} startIcon={<ArrowBack />} disabled={loading}>
                {step === 0 ? 'Cancel' : 'Back'}
              </Button>
              {step < STEPS.length - 1 ? (
                <Button variant="contained" onClick={handleNext} endIcon={<ArrowForward />} sx={{ px: 4 }}>
                  Continue
                </Button>
              ) : (
                <Button variant="contained" onClick={handleSubmit} disabled={loading} endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CheckCircle />} sx={{ px: 4, fontWeight: 700 }}>
                  {loading ? 'Registering...' : 'Register Church'}
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
