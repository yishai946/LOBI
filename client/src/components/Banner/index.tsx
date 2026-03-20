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
      <Typography variant="h5" sx={{ fontWeight: 700, mb: subtitle ? 1 : 0 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body1" sx={{ opacity: 0.85, fontStyle: 'italic' }}>
          {subtitle}
        </Typography>
      )}
    </BannerContainer>
  );

export default Banner;
