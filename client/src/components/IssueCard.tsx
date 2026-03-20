import { Issue } from '@entities/Issue';
import { IssueStatus } from '@enums/IssueStatus';
import { Box, Chip, Skeleton, Typography, type Theme } from '@mui/material';
import { getIssueStatusTimelineMessage } from '@utils/funcs';
import { useEffect, useState } from 'react';
import { Card, Column, Row } from './containers';

interface IssueCardProps {
  item: Issue;
}

const getStatusLabel = (status: IssueStatus): string => {
  switch (status) {
    case IssueStatus.OPEN:
      return 'פתוח';
    case IssueStatus.IN_PROGRESS:
      return 'בטיפול';
    case IssueStatus.DONE:
      return 'טופל';
    default:
      return status;
  }
};

const getStatusChipSx = (status: IssueStatus) => {
  return (theme: Theme) => {
    if (status === IssueStatus.OPEN) {
      return {
        bgcolor: theme.palette.warning.light,
        color: theme.palette.warning.main,
        fontWeight: 'bold',
      };
    }

    if (status === IssueStatus.IN_PROGRESS) {
      return {
        bgcolor: theme.palette.info.light,
        color: theme.palette.info.main,
        fontWeight: 'bold',
      };
    }

    return {
      bgcolor: theme.palette.success.light,
      color: theme.palette.success.main,
      fontWeight: 'bold',
    };
  };
};

export const IssueCard = ({ item }: IssueCardProps) => {
  const imageUrl = item.images[0]?.imageUrl;
  const hasImage = Boolean(imageUrl);
  const [isImageLoaded, setIsImageLoaded] = useState(!hasImage);

  useEffect(() => {
    setIsImageLoaded(!hasImage);
  }, [hasImage, imageUrl]);

  return (
    <Card isError={item.isUrgent}>
      <Row gap={2} width="100%">
        {hasImage && (
          <Box
            sx={{
              width: 100,
              height: 100,
              position: 'relative',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            {!isImageLoaded && (
              <Skeleton
                variant="rectangular"
                width={100}
                height={100}
                sx={{ position: 'absolute', inset: 0 }}
              />
            )}
            <Box
              component="img"
              src={imageUrl}
              alt={item.title}
              onLoad={() => setIsImageLoaded(true)}
              onError={() => setIsImageLoaded(true)}
              sx={{
                width: 100,
                height: 100,
                objectFit: 'cover',
                opacity: isImageLoaded ? 1 : 0,
                transition: 'opacity 0.2s ease',
              }}
            />
          </Box>
        )}
        <Row justifyContent="space-between" width="100%">
          <Column>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {item.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" pb={1}>
              {getIssueStatusTimelineMessage(item.status, {
                createdAt: item.createdAt,
                openedAt: item.openedAt,
                inProgressAt: item.inProgressAt,
                doneAt: item.doneAt,
              })}
            </Typography>
            {item.description && <Typography variant="body2">{item.description}</Typography>}
          </Column>
          <Chip label={getStatusLabel(item.status)} sx={getStatusChipSx(item.status)} />
        </Row>
      </Row>
    </Card>
  );
};
