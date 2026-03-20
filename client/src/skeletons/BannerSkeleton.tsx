import { BannerContainer } from '@components/Banner/BannerContainer';
import { Box, Paper, Skeleton } from '@mui/material';

const BannerSkeleton = () => (
  <BannerContainer>
    <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />
    <Skeleton variant="text" width="40%" height={20} sx={{ opacity: 0.85 }} />
  </BannerContainer>
);

export default BannerSkeleton;
