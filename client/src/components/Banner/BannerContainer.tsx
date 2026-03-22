import { Box, Paper, Typography } from '@mui/material';
import BannerSkeleton from '@skeletons/BannerSkeleton';

// ─── Container ───────────────────────────────────────────────────────────────

interface BannerContainerProps {
  children: React.ReactNode;
}

export const BannerContainer = ({ children }: BannerContainerProps) => (
  <Box component="main">
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        p: 3,
        mb: 3,
        position: 'relative',
        overflow: 'hidden',

        // Lavender bloom — hero level opacity, clearly above cards
        background: 'rgba(200, 185, 255, 0.45)',
        border: '1px solid rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',

        // Lifts it above the card glass layer
        boxShadow: `
          0 4px 20px rgba(130, 100, 220, 0.14),
          inset 0 1px 0 rgba(255, 255, 255, 0.85)
        `,

        // White shimmer catch light — top-left
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(145deg, rgba(255,255,255,0.55) 0%, rgba(190,170,255,0.15) 55%, transparent 100%)',
          borderRadius: 'inherit',
          pointerEvents: 'none',
        },

        // Soft lavender glow orb — bottom-left
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -15,
          left: -10,
          width: 90,
          height: 90,
          borderRadius: '50%',
          background: 'rgba(160, 130, 255, 0.18)',
          filter: 'blur(22px)',
          pointerEvents: 'none',
        },
      }}
    >
      {children}
    </Paper>
  </Box>
);

// ─── Banner ───────────────────────────────────────────────────────────────────

interface BannerProps {
  title: string;
  subtitle?: string;
  isLoading?: boolean;
}

const Banner = ({ title, subtitle, isLoading = false }: BannerProps) =>
  isLoading ? (
    <BannerSkeleton />
  ) : (
    <BannerContainer>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          mb: subtitle ? 1 : 0,
          color: 'text.primary', // resolves to #120d2e — dark navy, readable on lavender
          position: 'relative', // sits above ::before/::after pseudo layers
          zIndex: 1,
        }}
      >
        {title}
      </Typography>

      {subtitle && (
        <Typography
          variant="body1"
          sx={{
            opacity: 0.75,
            fontStyle: 'italic',
            color: 'text.primary',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </BannerContainer>
  );

export default Banner;
