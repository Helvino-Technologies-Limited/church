import { Box, Typography, Button, LinearProgress } from '@mui/material';
import { Warning, CheckCircle } from '@mui/icons-material';

interface Props {
  trialEndsAt: string;
  onContactSupport?: () => void;
}

export default function TrialBanner({ trialEndsAt }: Props) {
  const now = Date.now();
  const end = new Date(trialEndsAt).getTime();
  const total = 5 * 24 * 60 * 60 * 1000;
  const remaining = Math.max(0, end - now);
  const daysLeft = Math.ceil(remaining / (24 * 60 * 60 * 1000));
  const hoursLeft = Math.ceil(remaining / (60 * 60 * 1000));
  const progress = Math.max(0, Math.min(100, (remaining / total) * 100));
  const isUrgent = daysLeft <= 1;

  const label = daysLeft > 1 ? `${daysLeft} days` : hoursLeft > 0 ? `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}` : 'less than 1 hour';

  return (
    <Box
      sx={{
        mx: { xs: 0, md: 0 },
        mb: 2,
        p: 2,
        borderRadius: 2,
        background: isUrgent
          ? 'linear-gradient(135deg,#b71c1c,#c62828)'
          : 'linear-gradient(135deg,#e65100,#f4511e)',
        color: 'white',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Warning sx={{ fontSize: 22 }} />
      <Box sx={{ flex: 1, minWidth: 200 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
          Free Trial — {label} remaining
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ mt: 0.5, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.3)', '& .MuiLinearProgress-bar': { bgcolor: 'white' } }}
        />
      </Box>
      <Box sx={{ textAlign: 'right' }}>
        <Typography sx={{ fontSize: '0.78rem', opacity: 0.9 }}>
          Activate: M-Pesa Paybill <strong>522533</strong> · Account <strong>8071524</strong> · KES 50,000
        </Typography>
        <Typography sx={{ fontSize: '0.72rem', opacity: 0.7 }}>
          Send receipt to info@helvino.org or call 0110421320
        </Typography>
      </Box>
    </Box>
  );
}
