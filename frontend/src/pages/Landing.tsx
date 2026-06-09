import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Button, Grid, Card, CardContent,
  AppBar, Toolbar, IconButton, Chip, Avatar, Fade, Slide,
  useScrollTrigger, Paper, Divider, List, ListItem, ListItemIcon, ListItemText,
} from '@mui/material';
import {
  Church, Groups, AttachMoney, Assessment, Security, Cloud,
  CheckCircle, ArrowForward, Menu, Close, Phone, Email, Language,
  FormatQuote, Star, PlayArrow,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';

const JSON_LD_ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Helvino Technologies LTD',
  url: 'https://churchmanager-one.vercel.app',
  logo: 'https://churchmanager-one.vercel.app/favicon.svg',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+254-110-421-320',
    contactType: 'customer support',
    areaServed: 'KE',
    availableLanguage: 'English',
  },
  sameAs: [],
};

const JSON_LD_SOFTWARE = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'CMS-360',
  alternateName: 'Church Management System 360',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://churchmanager-one.vercel.app',
  description: 'CMS-360 is a cloud-based, multi-tenant church management platform for Kenyan churches. Manage members, attendance, donations, payroll, and finance — all in one system.',
  offers: [
    { '@type': 'Offer', name: 'Starter', price: '1500', priceCurrency: 'KES', billingIncrement: 'P1M' },
    { '@type': 'Offer', name: 'Standard', price: '3500', priceCurrency: 'KES', billingIncrement: 'P1M' },
    { '@type': 'Offer', name: 'Professional', price: '7500', priceCurrency: 'KES', billingIncrement: 'P1M' },
  ],
  author: { '@type': 'Organization', name: 'Helvino Technologies LTD' },
  inLanguage: 'en-KE',
  keywords: 'church management software Kenya, parish management, tithe tracking, church attendance',
};

const JSON_LD_WEBPAGE = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'CMS-360 — Church Management Software for Kenya',
  description: 'Cloud-based church management platform. Manage members, attendance, donations, payroll and finance in one system.',
  url: 'https://churchmanager-one.vercel.app',
  inLanguage: 'en-KE',
  publisher: { '@type': 'Organization', name: 'Helvino Technologies LTD' },
  potentialAction: {
    '@type': 'RegisterAction',
    target: 'https://churchmanager-one.vercel.app/register',
    name: 'Start Free Trial',
  },
};

const BIBLE_VERSES = [
  { verse: '"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."', ref: 'John 3:16' },
  { verse: '"I can do all things through Christ who strengthens me."', ref: 'Philippians 4:13' },
  { verse: '"Trust in the LORD with all your heart and lean not on your own understanding."', ref: 'Proverbs 3:5' },
  { verse: '"For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you."', ref: 'Jeremiah 29:11' },
  { verse: '"Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit."', ref: 'Matthew 28:19' },
];

const HERO_IMAGES = [
  // Cross at sunset
  'https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=1920&q=80',
  // Worship congregation — hands raised, no Catholic imagery
  'https://images.unsplash.com/photo-1510651767069-f8feeed3a99f?auto=format&fit=crop&w=1920&q=80',
  // Open Bible — clean, no icons/idols
  'https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=1920&q=80',
];

const GALLERY_IMAGES = [
  // Joyful congregation together
  { src: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=80', label: 'Vibrant Community' },
  // Hands raised in worship
  { src: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80', label: 'Worship & Praise' },
  // People in fellowship / small group
  { src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80', label: 'Faith & Growth' },
  // Community outreach / serving
  { src: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=600&q=80', label: 'Mission & Outreach' },
];

const PLANS = [
  {
    name: 'Starter', price: 'KES 1,500', period: '/month', color: '#4caf50',
    features: ['Single Church', 'Up to 200 Members', 'Up to 5 Users', 'Basic Reports', 'Member Management'],
    popular: false,
  },
  {
    name: 'Standard', price: 'KES 3,500', period: '/month', color: '#1a237e',
    features: ['Multi-Branch', 'Unlimited Members', 'Up to 20 Users', 'HR Module', 'Finance Module', 'Advanced Reports'],
    popular: true,
  },
  {
    name: 'Professional', price: 'KES 7,500', period: '/month', color: '#6a1b9a',
    features: ['Full ERP Suite', 'Payroll Module', 'Asset Management', 'Custom Reports', 'API Access', 'Priority Support'],
    popular: false,
  },
  {
    name: 'Enterprise', price: 'Custom', period: '', color: '#bf360c',
    features: ['Diocese Management', 'Multi-Parish', 'Custom Branding', 'Custom Domain', 'Dedicated Support', 'SLA Guarantee'],
    popular: false,
  },
];

const FEATURES = [
  { icon: <Groups fontSize="large" />, title: 'Member Management', desc: 'Complete member profiles, attendance tracking, family records, and spiritual milestones all in one place.' },
  { icon: <AttachMoney fontSize="large" />, title: 'Finance & Donations', desc: 'Track tithes, offerings, pledges, and project funds with full accountability and automated receipts.' },
  { icon: <Church fontSize="large" />, title: 'Multi-Branch / Diocese', desc: 'Manage multiple branches, parishes, or dioceses from a single unified platform with isolated data.' },
  { icon: <Assessment fontSize="large" />, title: 'Reports & Analytics', desc: 'Powerful dashboards and reports for membership growth, giving trends, attendance, and more.' },
  { icon: <Security fontSize="large" />, title: 'Enterprise Security', desc: 'Row-level security, data isolation, encrypted storage, and full audit trails for every action.' },
  { icon: <Cloud fontSize="large" />, title: 'Cloud-Based SaaS', desc: 'No installation needed. Access from any device, anywhere. Automatic backups and 99.9% uptime.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [heroIndex, setHeroIndex] = useState(0);
  const [verseIndex, setVerseIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [verseVisible, setVerseVisible] = useState(true);

  const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 60 });

  useEffect(() => {
    const heroTimer = setInterval(() => setHeroIndex((i) => (i + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(heroTimer);
  }, []);

  useEffect(() => {
    const verseTimer = setInterval(() => {
      setVerseVisible(false);
      setTimeout(() => {
        setVerseIndex((i) => (i + 1) % BIBLE_VERSES.length);
        setVerseVisible(true);
      }, 600);
    }, 6000);
    return () => clearInterval(verseTimer);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <Box>
      {/* ── SEO ─────────────────────────────────── */}
      <Helmet>
        <title>CMS-360 | Church Management Software — Kenya</title>
        <meta name="description" content="CMS-360 is a cloud-based church management platform for Kenyan churches. Manage members, attendance, donations, payroll, and finance — all in one system. Free trial available." />
        <meta name="keywords" content="church management software Kenya, church management system, church member management, church attendance tracking, church finance software, parish management, tithe tracking, church ERP, diocese management, CMS-360, Helvino Technologies" />
        <link rel="canonical" href="https://churchmanager-one.vercel.app/" />
        <meta property="og:url" content="https://churchmanager-one.vercel.app/" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(JSON_LD_ORGANIZATION)}</script>
        <script type="application/ld+json">{JSON.stringify(JSON_LD_SOFTWARE)}</script>
        <script type="application/ld+json">{JSON.stringify(JSON_LD_WEBPAGE)}</script>
      </Helmet>

      {/* ── Navbar ──────────────────────────────── */}
      <AppBar
        position="fixed"
        elevation={trigger ? 4 : 0}
        sx={{
          background: trigger ? 'rgba(26,35,126,0.97)' : 'transparent',
          backdropFilter: trigger ? 'blur(12px)' : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
            <Box
              sx={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'linear-gradient(135deg, #c8a415, #fdd54f)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Church sx={{ color: '#1a237e', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1, color: 'white', fontFamily: "'Playfair Display', serif" }}>
                CMS-360
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1, fontSize: '0.65rem' }}>
                Church Management Platform
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center' }}>
            {navLinks.map((link) => (
              <Button key={link.label} href={link.href} sx={{ color: 'white', fontWeight: 500 }}>
                {link.label}
              </Button>
            ))}
            <Button variant="outlined" onClick={() => navigate('/login')} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', ml: 1 }}>
              Login
            </Button>
            <Button variant="contained" onClick={() => navigate('/register')} sx={{ background: 'linear-gradient(135deg,#c8a415,#fdd54f)', color: '#000', fontWeight: 700, '&:hover': { background: '#c8a415' } }}>
              Get Started Free
            </Button>
          </Box>

          <IconButton sx={{ display: { md: 'none' }, color: 'white' }} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <Close /> : <Menu />}
          </IconButton>
        </Toolbar>

        {mobileMenuOpen && (
          <Box sx={{ background: 'rgba(26,35,126,0.98)', pb: 2, px: 2 }}>
            {navLinks.map((l) => (
              <Button key={l.label} fullWidth href={l.href} sx={{ color: 'white', justifyContent: 'flex-start', py: 1 }} onClick={() => setMobileMenuOpen(false)}>
                {l.label}
              </Button>
            ))}
            <Button fullWidth variant="outlined" onClick={() => navigate('/login')} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', mt: 1 }}>Login</Button>
            <Button fullWidth variant="contained" onClick={() => navigate('/register')} sx={{ background: '#c8a415', color: '#000', mt: 1, fontWeight: 700 }}>Get Started Free</Button>
          </Box>
        )}
      </AppBar>

      {/* ── Hero Section ─────────────────────────── */}
      <Box
        sx={{
          minHeight: '100vh',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        {HERO_IMAGES.map((img, i) => (
          <Box
            key={img}
            sx={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${img})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transition: 'opacity 1.5s ease-in-out',
              opacity: i === heroIndex ? 1 : 0,
            }}
          />
        ))}
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,20,0.85) 0%, rgba(0,0,20,0.6) 50%, rgba(0,0,20,0.4) 100%)' }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pt: 12 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip label="✝ Trusted by Churches Across Africa" sx={{ mb: 3, bgcolor: 'rgba(200,164,21,0.2)', color: '#fdd54f', border: '1px solid rgba(200,164,21,0.4)', fontWeight: 600 }} />
              <Typography variant="h1" sx={{ fontSize: { xs: '2.5rem', md: '3.8rem' }, color: 'white', lineHeight: 1.15, mb: 2 }}>
                Manage Your Church{' '}
                <Box component="span" sx={{ color: '#fdd54f' }}>Smarter</Box>
                {' '}& Grow Your{' '}
                <Box component="span" sx={{ color: '#fdd54f' }}>Kingdom</Box>
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.15rem', mb: 4, maxWidth: 560, lineHeight: 1.7 }}>
                CMS-360 is Africa's leading multi-tenant church management platform. Empower your church with modern tools for members, finance, HR, assets, and more — all in one place.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 5 }}>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/register')}
                  sx={{ background: 'linear-gradient(135deg,#c8a415,#fdd54f)', color: '#000', fontWeight: 800, fontSize: '1rem', px: 4, py: 1.5 }}
                >
                  Start Free 30-Day Trial
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<PlayArrow />}
                  onClick={() => navigate('/login')}
                  sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', fontSize: '1rem', px: 4, py: 1.5, '&:hover': { borderColor: 'white' } }}
                >
                  View Demo
                </Button>
              </Box>

              <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {[['500+', 'Churches'], ['150K+', 'Members'], ['15+', 'Countries'], ['99.9%', 'Uptime']].map(([val, lbl]) => (
                  <Box key={lbl}>
                    <Typography variant="h4" sx={{ color: '#fdd54f', fontWeight: 800, lineHeight: 1 }}>{val}</Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>{lbl}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 4,
                  textAlign: 'center',
                }}
              >
                <FormatQuote sx={{ fontSize: 48, color: '#fdd54f', opacity: 0.6 }} />
                <Fade in={verseVisible} timeout={600}>
                  <Box>
                    <Typography
                      sx={{ color: 'rgba(255,255,255,0.95)', fontSize: '1.05rem', fontStyle: 'italic', lineHeight: 1.8, mb: 2 }}
                    >
                      {BIBLE_VERSES[verseIndex].verse}
                    </Typography>
                    <Typography sx={{ color: '#fdd54f', fontWeight: 700, fontSize: '0.9rem' }}>
                      — {BIBLE_VERSES[verseIndex].ref}
                    </Typography>
                  </Box>
                </Fade>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 3 }}>
                  {BIBLE_VERSES.map((_, i) => (
                    <Box key={i} sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: i === verseIndex ? '#fdd54f' : 'rgba(255,255,255,0.3)', transition: 'all 0.3s', cursor: 'pointer' }} onClick={() => setVerseIndex(i)} />
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── Trusted By Banner ────────────────────── */}
      <Box sx={{ bgcolor: '#1a237e', py: 2.5 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Trusted by leading churches
            </Typography>
            {['Grace Community Church', 'Calvary Fellowship', 'Hope Chapel', 'City Mission Church', 'Bethel International'].map((c) => (
              <Typography key={c} sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: '0.9rem' }}>{c}</Typography>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── Features Section ─────────────────────── */}
      <Box id="features" sx={{ py: 12, bgcolor: '#f8f9ff' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip label="FEATURES" sx={{ bgcolor: 'rgba(26,35,126,0.08)', color: '#1a237e', fontWeight: 700, mb: 2 }} />
            <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.8rem' }, color: '#1a237e', mb: 2 }}>
              Everything Your Church Needs
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '1.1rem', maxWidth: 600, mx: 'auto' }}>
              A complete suite of tools designed specifically for churches, ministries, and faith-based organizations.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {FEATURES.map((f) => (
              <Grid item xs={12} sm={6} md={4} key={f.title}>
                <Card sx={{ height: '100%', p: 1, transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 12px 40px rgba(26,35,126,0.15)' } }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ width: 56, height: 56, borderRadius: 2, bgcolor: 'rgba(26,35,126,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a237e', mb: 2 }}>
                      {f.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1a237e' }}>{f.title}</Typography>
                    <Typography sx={{ color: 'text.secondary', lineHeight: 1.7 }}>{f.desc}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── Gallery Section ───────────────────────── */}
      <Box id="gallery" sx={{ py: 12, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip label="COMMUNITY" sx={{ bgcolor: 'rgba(200,164,21,0.1)', color: '#937500', fontWeight: 700, mb: 2 }} />
            <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.8rem' }, color: '#1a237e', mb: 2 }}>
              Empowering Faith Communities
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '1.1rem', maxWidth: 600, mx: 'auto' }}>
              Join thousands of churches worldwide who are transforming how they serve their congregations.
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {GALLERY_IMAGES.map((img, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Box
                  sx={{
                    position: 'relative', borderRadius: 3, overflow: 'hidden',
                    height: { xs: 200, md: 300 },
                    '&:hover .overlay': { opacity: 1 },
                    '&:hover img': { transform: 'scale(1.08)' },
                  }}
                >
                  <Box
                    component="img"
                    src={img.src}
                    alt={img.label}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease', display: 'block' }}
                  />
                  <Box
                    className="overlay"
                    sx={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to top, rgba(26,35,126,0.85), transparent)',
                      display: 'flex', alignItems: 'flex-end', p: 2,
                      opacity: 0.7, transition: 'opacity 0.3s',
                    }}
                  >
                    <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>{img.label}</Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── Bible Verse Banner ───────────────────── */}
      <Box sx={{ py: 10, background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', inset: 0, backgroundImage: 'url(https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1920&q=30)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.15 }} />
        <Container maxWidth="md" sx={{ position: 'relative', textAlign: 'center' }}>
          <FormatQuote sx={{ fontSize: 64, color: 'rgba(253,213,79,0.5)', mb: 2 }} />
          <Typography variant="h3" sx={{ color: 'white', fontStyle: 'italic', mb: 3, fontSize: { xs: '1.5rem', md: '2rem' }, lineHeight: 1.6 }}>
            "Where two or three gather in my name, there am I with them."
          </Typography>
          <Typography sx={{ color: '#fdd54f', fontWeight: 700, fontSize: '1.1rem' }}>— Matthew 18:20</Typography>
          <Divider sx={{ my: 5, borderColor: 'rgba(255,255,255,0.2)' }} />
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 4, fontSize: '1.1rem' }}>
            Start managing your church the smart way today.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/register')}
            sx={{ background: 'linear-gradient(135deg,#c8a415,#fdd54f)', color: '#000', fontWeight: 800, fontSize: '1.1rem', px: 5, py: 1.8 }}
            endIcon={<ArrowForward />}
          >
            Register Your Church Free
          </Button>
        </Container>
      </Box>

      {/* ── Pricing ──────────────────────────────── */}
      <Box id="pricing" sx={{ py: 12, bgcolor: '#f8f9ff' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip label="PRICING" sx={{ bgcolor: 'rgba(26,35,126,0.08)', color: '#1a237e', fontWeight: 700, mb: 2 }} />
            <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.8rem' }, color: '#1a237e', mb: 2 }}>
              Simple, Transparent Pricing
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '1.1rem' }}>
              One system. Everything your church needs. No hidden fees.
            </Typography>
          </Box>

          {/* Two pricing cards */}
          <Grid container spacing={4} justifyContent="center" alignItems="stretch" sx={{ mb: 6 }}>
            {/* Year 1 */}
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%', border: '1px solid rgba(0,0,0,0.08)', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-6px)', boxShadow: 6 } }}>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Box sx={{ width: 56, height: 56, borderRadius: 2, bgcolor: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, mx: 'auto' }}>
                    <Church sx={{ color: 'white', fontSize: 28 }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#4caf50', mb: 0.5 }}>First Year</Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mb: 2 }}>Full access — onboarding included</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 1, justifyContent: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: '#1a237e' }}>KES 50,000</Typography>
                  </Box>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mb: 3 }}>one-time first-year fee</Typography>
                  <Divider sx={{ mb: 3 }} />
                  <List dense disablePadding sx={{ textAlign: 'left', mb: 3 }}>
                    {['All Modules Included', 'Unlimited Members', 'Multi-Branch Support', 'Finance & Payroll', 'Reports & Analytics', 'Free Setup & Training', 'Email & Phone Support'].map((f) => (
                      <ListItem key={f} disablePadding sx={{ mb: 0.8 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}><CheckCircle sx={{ fontSize: 18, color: '#4caf50' }} /></ListItemIcon>
                        <ListItemText primary={f} primaryTypographyProps={{ fontSize: '0.9rem' }} />
                      </ListItem>
                    ))}
                  </List>
                  <Button fullWidth variant="outlined" sx={{ borderColor: '#4caf50', color: '#4caf50', fontWeight: 700, '&:hover': { bgcolor: '#4caf50', color: 'white' } }} onClick={() => navigate('/register')}>
                    Start Free Trial
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Annual Renewal */}
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%', border: '2px solid #1a237e', position: 'relative', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-6px)', boxShadow: 6 } }}>
                <Chip label="RENEWAL RATE" size="small" sx={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', bgcolor: '#1a237e', color: 'white', fontWeight: 700, fontSize: '0.65rem' }} />
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Box sx={{ width: 56, height: 56, borderRadius: 2, bgcolor: '#1a237e', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, mx: 'auto' }}>
                    <Church sx={{ color: '#fdd54f', fontSize: 28 }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a237e', mb: 0.5 }}>Annual Renewal</Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mb: 2 }}>Year 2 onwards — same full access</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 1, justifyContent: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: '#1a237e' }}>KES 20,000</Typography>
                  </Box>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mb: 3 }}>per year</Typography>
                  <Divider sx={{ mb: 3 }} />
                  <List dense disablePadding sx={{ textAlign: 'left', mb: 3 }}>
                    {['All Modules Included', 'Unlimited Members', 'Multi-Branch Support', 'Finance & Payroll', 'Reports & Analytics', 'Ongoing Updates', 'Priority Support'].map((f) => (
                      <ListItem key={f} disablePadding sx={{ mb: 0.8 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}><CheckCircle sx={{ fontSize: 18, color: '#1a237e' }} /></ListItemIcon>
                        <ListItemText primary={f} primaryTypographyProps={{ fontSize: '0.9rem' }} />
                      </ListItem>
                    ))}
                  </List>
                  <Button fullWidth variant="contained" sx={{ bgcolor: '#1a237e', fontWeight: 700, '&:hover': { bgcolor: '#283593' } }} onClick={() => navigate('/register')}>
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* M-Pesa Payment Box */}
          <Box sx={{ maxWidth: 520, mx: 'auto' }}>
            <Paper
              sx={{
                p: 3, borderRadius: 3, textAlign: 'center',
                background: 'linear-gradient(135deg,#1a237e 0%,#283593 100%)',
                color: 'white',
              }}
            >
              <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', mb: 1 }}>Pay via M-Pesa</Typography>
              <Typography sx={{ opacity: 0.8, fontSize: '0.85rem', mb: 2 }}>
                Subscribe or renew instantly using M-Pesa Paybill
              </Typography>
              <Grid container spacing={2} justifyContent="center">
                <Grid item xs={6}>
                  <Box sx={{ bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 2, p: 1.5 }}>
                    <Typography sx={{ fontSize: '0.7rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1 }}>Paybill Number</Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: '1.4rem', color: '#fdd54f', fontFamily: 'monospace' }}>522533</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 2, p: 1.5 }}>
                    <Typography sx={{ fontSize: '0.7rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1 }}>Account Number</Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: '1.4rem', color: '#fdd54f', fontFamily: 'monospace' }}>8071524</Typography>
                  </Box>
                </Grid>
              </Grid>
              <Typography sx={{ mt: 2, fontSize: '0.75rem', opacity: 0.6 }}>
                Use your church name as payment reference. Send receipt to info@helvino.org
              </Typography>
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* ── Testimonials ─────────────────────────── */}
      <Box sx={{ py: 10, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip label="TESTIMONIALS" sx={{ bgcolor: 'rgba(26,35,126,0.08)', color: '#1a237e', fontWeight: 700, mb: 2 }} />
            <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.8rem' }, color: '#1a237e' }}>What Pastors Say</Typography>
          </Box>
          <Grid container spacing={3}>
            {[
              { name: 'Pastor John Kamau', church: 'Grace Community Church, Nairobi', text: 'CMS-360 transformed how we manage our congregation. What used to take hours now takes minutes. The finance module alone is worth every shilling.', avatar: 'JK' },
              { name: 'Bishop Samuel Omondi', church: 'Calvary Fellowship, Mombasa', text: 'Managing 5 branches was a nightmare before CMS-360. Now I have a real-time overview of every branch, every member, every donation — all in one dashboard.', avatar: 'SO' },
              { name: 'Reverend Alice Waweru', church: 'Hope Chapel, Kisumu', text: 'As a small church, we needed something affordable and easy to use. CMS-360 Starter plan is perfect for us. The support team is amazing and very responsive.', avatar: 'AW' },
            ].map((t) => (
              <Grid item xs={12} md={4} key={t.name}>
                <Card sx={{ height: '100%', p: 1 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', mb: 2 }}>
                      {[1, 2, 3, 4, 5].map((s) => <Star key={s} sx={{ color: '#fdd54f', fontSize: 18 }} />)}
                    </Box>
                    <Typography sx={{ color: 'text.secondary', fontStyle: 'italic', mb: 3, lineHeight: 1.7 }}>"{t.text}"</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#1a237e', fontWeight: 700 }}>{t.avatar}</Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{t.name}</Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{t.church}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── Contact / Footer ─────────────────────── */}
      <Box id="contact" sx={{ bgcolor: '#0d1242', py: 10, color: 'white' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#c8a415,#fdd54f)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Church sx={{ color: '#1a237e', fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>CMS-360</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Multi-Tenant Church Platform</Typography>
                </Box>
              </Box>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, mb: 3 }}>
                Empowering churches across Africa with modern management tools. Built with love for the Kingdom.
              </Typography>
              <Typography sx={{ color: '#fdd54f', fontStyle: 'italic', fontSize: '0.9rem' }}>
                "To equip God's people for works of service." — Ephesians 4:12
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#fdd54f' }}>Quick Links</Typography>
              {['Features', 'Pricing', 'Register Church', 'Login', 'Support'].map((link) => (
                <Typography key={link} sx={{ color: 'rgba(255,255,255,0.7)', mb: 1, cursor: 'pointer', '&:hover': { color: '#fdd54f' }, transition: 'color 0.2s' }}>
                  → {link}
                </Typography>
              ))}
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#fdd54f' }}>Contact Helvino Technologies</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Phone sx={{ color: '#fdd54f', fontSize: 20 }} />
                <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>0110421320</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Email sx={{ color: '#fdd54f', fontSize: 20 }} />
                <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>info@helvino.org</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                <Language sx={{ color: '#fdd54f', fontSize: 20 }} />
                <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>www.helvino.org</Typography>
              </Box>
              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate('/register')}
                sx={{ background: 'linear-gradient(135deg,#c8a415,#fdd54f)', color: '#000', fontWeight: 800 }}
              >
                Start Free Trial
              </Button>
            </Grid>
          </Grid>

          <Divider sx={{ my: 5, borderColor: 'rgba(255,255,255,0.1)' }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
              © {new Date().getFullYear()} Helvino Technologies LTD. All rights reserved.
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
              CMS-360 — Church Management Platform v1.0
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
