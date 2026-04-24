import { issuesService } from '@api/issuesService';
import { ConfirmationDialog } from '@components/dialogs';
import { Column, Row } from '@components/containers';
import { IssueStatus } from '@enums/IssueStatus';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { Box, Button, IconButton, Step, StepLabel, Stepper, Typography } from '@mui/material';
import { ContextType } from '@enums/ContextType';
import { useAuth } from '@providers/AuthContext';
import { useGlobalMessage } from '@providers/MessageProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IssueCard } from '@components/Cards/IssueCard';
import { IssueDetailsPageSkeleton } from '@skeletons/IssueDetailsPageSkeleton';
import { EditIssueDialog } from './EditIssueDialog';
import { translateContextType } from '@utils/contextTypeTranslations';

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    return typeof message === 'string' ? message : fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const formatDate = (value?: string | null): string => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('he-IL');
};

export const IssueDetailsPage = () => {
  const { currentContext, user } = useAuth();
  const { showError, showSuccess } = useGlobalMessage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { issueId } = useParams<{ issueId: string }>();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const canManage =
    currentContext?.type === ContextType.MANAGER || currentContext?.type === ContextType.ADMIN;

  const { data: issue, isLoading } = useQuery({
    queryKey: ['issues', 'details', issueId],
    queryFn: () => issuesService.getIssueById(issueId as string),
    enabled: Boolean(issueId),
  });

  const deleteIssueMutation = useMutation({
    mutationFn: () => issuesService.deleteIssue(issueId as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      showSuccess('התקלה נמחקה בהצלחה');
      navigate('/issues', { replace: true });
    },
    onError: (error) => {
      showError(getErrorMessage(error, 'שגיאה במחיקת התקלה'));
    },
  });

  const activeStep = useMemo(() => {
    if (!issue) {
      return 0;
    }

    if (issue.status === IssueStatus.DONE) {
      return 2;
    }

    if (issue.status === IssueStatus.IN_PROGRESS) {
      return 1;
    }

    return 0;
  }, [issue]);

  if (isLoading) {
    return <IssueDetailsPageSkeleton />;
  }

  if (!issue) {
    return (
      <Column sx={{ gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          התקלה לא נמצאה
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/issues')}>
          חזרה לרשימת התקלות
        </Button>
      </Column>
    );
  }

  const isSameCreatorContext =
    issue.createdById === user?.id &&
    Boolean(issue.createdBy?.contextType) &&
    issue.createdBy?.contextType === currentContext?.type;
  const canEdit = canManage || isSameCreatorContext;
  const canDelete = canManage || isSameCreatorContext;

  const handleDelete = () => setIsDeleteDialogOpen(true);

  const handleDeleteCancel = () => {
    if (deleteIssueMutation.isPending) {
      return;
    }

    setIsDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = () => {
    setIsDeleteDialogOpen(false);
    deleteIssueMutation.mutate();
  };

  return (
    <Column gap={1}>
      <Row sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/issues')}>
          חזרה
        </Button>
        <Row sx={{ gap: 1 }}>
          {canEdit && (
            <IconButton onClick={() => setIsEditDialogOpen(true)} color="primary">
              <EditRoundedIcon />
            </IconButton>
          )}
          {canDelete && (
            <IconButton
              onClick={handleDelete}
              disabled={deleteIssueMutation.isPending}
              color="error"
            >
              <DeleteOutlineRoundedIcon />
            </IconButton>
          )}
        </Row>
      </Row>
      <IssueCard item={issue} isClickable={false} />
      <Typography variant="body2" color="text.secondary">
        {`נפתח על ידי ${issue.createdBy?.name || 'לא ידוע'} (${translateContextType(issue.createdBy?.contextType || issue.createdBy?.role)})`}
      </Typography>
      <Column sx={{ gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          ציר זמן טיפול
        </Typography>
        <Stepper activeStep={activeStep} alternativeLabel>
          <Step>
            <StepLabel>דיווח ({formatDate(issue.openedAt)})</StepLabel>
          </Step>
          <Step>
            <StepLabel>בטיפול ({formatDate(issue.inProgressAt)})</StepLabel>
          </Step>
          <Step>
            <StepLabel>טופל ({formatDate(issue.doneAt)})</StepLabel>
          </Step>
        </Stepper>
      </Column>

      {issue.images.length > 0 && (
        <Column
          sx={{
            p: 2,
            gap: 1.5,
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            תמונות
          </Typography>

          <Row
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              flexWrap: { sm: 'wrap' },
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.25,
            }}
          >
            {issue.images.map((image) => (
              <Box
                key={image.id}
                component="img"
                src={image.imageUrl}
                alt={issue.title}
                sx={{
                  display: 'block',
                  width: { xs: '100%', sm: 'auto' },
                  maxWidth: '100%',
                  height: 'auto',
                  maxHeight: { xs: 260, sm: 360 },
                  borderRadius: 1.5,
                  objectFit: 'cover',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxSizing: 'border-box',
                }}
              />
            ))}
          </Row>
        </Column>
      )}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        title="מחיקת תקלה"
        message="האם למחוק את התקלה? פעולה זו אינה הפיכה."
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        confirmLabel="מחיקה"
        isConfirming={deleteIssueMutation.isPending}
        confirmColor="error"
      />
      <EditIssueDialog
        open={isEditDialogOpen}
        issue={issue}
        onClose={() => setIsEditDialogOpen(false)}
      />
    </Column>
  );
};
