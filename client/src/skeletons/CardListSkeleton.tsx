import { Column } from '@components/containers';
import { Skeleton, Typography } from '@mui/material';

interface CardListSkeletonProps {
  title?: string;
}

export const CardListSkeleton = ({ title }: CardListSkeletonProps) => (
  <Column gap={2}>
    {title && (
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
    )}
    <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
    <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
  </Column>
);
