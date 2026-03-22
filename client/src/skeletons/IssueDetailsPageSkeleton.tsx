import { Column, Row } from '@components/containers';
import { Box, Skeleton } from '@mui/material';

export const IssueDetailsPageSkeleton = () => (
  <Column sx={{ gap: 4 }}>
    <Row sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
      <Skeleton variant="rounded" width={96} height={36} />
      <Skeleton variant="rounded" width={40} height={36} />
    </Row>

    <Skeleton variant="rounded" height={180} sx={{ borderRadius: 2 }} />

    <Column sx={{ gap: 1.5 }}>
      <Skeleton variant="text" width={140} height={34} />
      <Skeleton variant="rounded" height={56} sx={{ borderRadius: 2 }} />
    </Column>

    <Column sx={{ gap: 1.5 }}>
      <Skeleton variant="text" width={80} height={34} />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(1, minmax(0, 1fr))',
            sm: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(3, minmax(0, 1fr))',
          },
          gap: 1.25,
        }}
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={180} sx={{ borderRadius: 1.5 }} />
        ))}
      </Box>
    </Column>
  </Column>
);
