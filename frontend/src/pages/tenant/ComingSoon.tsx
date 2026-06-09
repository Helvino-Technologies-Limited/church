import React from 'react';
import { Box, Typography, Card, CardContent, Chip } from '@mui/material';
import { Construction } from '@mui/icons-material';

interface Props {
  title: string;
  description?: string;
}

export default function ComingSoon({ title, description }: Props) {
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e', mb: 3 }}>{title}</Typography>
      <Card>
        <CardContent sx={{ py: 8, textAlign: 'center' }}>
          <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(26,35,126,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
            <Construction sx={{ fontSize: 40, color: '#1a237e', opacity: 0.5 }} />
          </Box>
          <Chip label="COMING SOON" sx={{ bgcolor: 'rgba(26,35,126,0.1)', color: '#1a237e', fontWeight: 700, mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a237e', mb: 1 }}>{title}</Typography>
          <Typography sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
            {description || `The ${title} module is currently under development and will be available soon.`}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
