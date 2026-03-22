import { issuesService } from '@api/issuesService';
import { Issue } from '@entities/Issue';
import { ContextType } from '@enums/ContextType';
import { IssueStatus } from '@enums/IssueStatus';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import { Box, Chip, IconButton, Skeleton, Typography, type Theme } from '@mui/material';
import { useAuth } from '@providers/AuthContext';
import { useGlobalMessage } from '@providers/MessageProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage, getIssueStatusTimelineMessage } from '@utils/funcs';
import { translateIssueStatus } from '@utils/issueStatusTranslations';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Column, Row } from '../containers';

interface IssueCardProps {
  item: Issue;
  isClickable?: boolean;
}

const translateReporterRole = (role?: string): string => {
  if (role === 'ADMIN') {
    return 'אדמין';
  }

  if (role === 'USER') {
    return 'דייר';
  }

  return 'לא ידוע';
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

export const IssueCard = ({ item, isClickable = true }: IssueCardProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentContext } = useAuth();
  const { showError, showSuccess } = useGlobalMessage();
  const imageUrl = item.images[0]?.imageUrl;
  const hasImage = Boolean(imageUrl);
  const [isImageLoaded, setIsImageLoaded] = useState(!hasImage);
  const hasStatusActions = !isClickable;
  const showReporterInfo = Boolean(item.createdBy);
  const canManage =
    currentContext?.type === ContextType.MANAGER || currentContext?.type === ContextType.ADMIN;
  const isAtFirstStatus = item.status === IssueStatus.OPEN;
  const isAtLastStatus = item.status === IssueStatus.DONE;

  const { mutate: moveStatusNext, isPending: isMoveStatusNextPending } = useMutation({
    mutationFn: () => issuesService.moveIssueToNextStatus(item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      showSuccess('התקלה הועברה לשלב הבא');
    },
    onError: (error) => {
      showError(getErrorMessage(error, 'שגיאה בעדכון סטטוס התקלה'));
    },
  });

  const { mutate: moveStatusPrevious, isPending: isMoveStatusPreviousPending } = useMutation({
    mutationFn: () => issuesService.moveIssueToPreviousStatus(item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      showSuccess('התקלה הועברה לשלב הקודם');
    },
    onError: (error) => {
      showError(getErrorMessage(error, 'שגיאה בעדכון סטטוס התקלה'));
    },
  });

  const isStatusMovePending = isMoveStatusNextPending || isMoveStatusPreviousPending;
  const isMoveStatusPreviousDisabled = isAtFirstStatus || isStatusMovePending;
  const isMoveStatusNextDisabled = isAtLastStatus || isStatusMovePending;

  useEffect(() => {
    setIsImageLoaded(!hasImage);
  }, [hasImage, imageUrl]);

  return (
    <Card
      isError={item.isUrgent}
      onClick={isClickable ? () => navigate(`/issues/${item.id}`) : undefined}
      sx={{
        position: 'relative',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'transform 0.16s ease, box-shadow 0.2s ease',
        '@media (hover: hover)': {
          '&:hover': {
            transform: isClickable ? 'translateY(-2px)' : 'none',
            boxShadow: isClickable
              ? '0 12px 24px rgba(15, 23, 42, 0.12)'
              : '0 8px 20px rgba(15, 23, 42, 0.08)',
          },
        },
      }}
    >
      <Row gap={2} width="100%" alignItems="flex-start" pb={1.5}>
        {hasImage && (
          <Box
            sx={{
              width: { xs: 78, sm: 100 },
              height: { xs: 78, sm: 100 },
              position: 'relative',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            {!isImageLoaded && (
              <Skeleton
                variant="rectangular"
                width="100%"
                height="100%"
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
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: isImageLoaded ? 1 : 0,
                transition: 'opacity 0.2s ease',
              }}
            />
          </Box>
        )}
        <Row
          justifyContent="space-between"
          width="100%"
          gap={1}
          sx={{
            minWidth: 0,
            flexDirection: 'row',
            alignItems: 'flex-start',
            flexWrap: 'nowrap',
          }}
        >
          <Column sx={{ minWidth: 0, flex: 1, pr: 0.5 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                lineHeight: 1.2,
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
              }}
            >
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
          <Row
            alignItems="center"
            alignSelf="flex-start"
            sx={{
              gap: 0.5,
              flexWrap: 'nowrap',
              flexShrink: 0,
            }}
          >
            {hasStatusActions && canManage && (
              <IconButton
                size="small"
                aria-label="העבר לשלב הבא"
                onClick={(event) => {
                  event.stopPropagation();
                  moveStatusNext();
                }}
                disabled={isMoveStatusNextDisabled}
              >
                <ArrowForwardIosRoundedIcon fontSize="small" />
              </IconButton>
            )}
            <Chip label={translateIssueStatus(item.status)} sx={getStatusChipSx(item.status)} />
            {hasStatusActions && canManage && (
              <IconButton
                size="small"
                aria-label="העבר לשלב הקודם"
                onClick={(event) => {
                  event.stopPropagation();
                  moveStatusPrevious();
                }}
                disabled={isMoveStatusPreviousDisabled}
              >
                <ArrowBackIosNewRoundedIcon fontSize="small" />
              </IconButton>
            )}
          </Row>
        </Row>
      </Row>
      {showReporterInfo && (
        <Box
          sx={{
            position: 'absolute',
            right: 16,
            bottom: 12,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {`${item.createdBy?.name || 'לא ידוע'} (${translateReporterRole(item.createdBy?.role)})`}
          </Typography>
        </Box>
      )}
    </Card>
  );
};
