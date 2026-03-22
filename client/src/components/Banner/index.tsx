import { Typography } from '@mui/material';
import BannerSkeleton from '@skeletons/BannerSkeleton';
import { BannerContainer } from './BannerContainer';

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
          color: 'text.primary',
          position: 'relative',
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
