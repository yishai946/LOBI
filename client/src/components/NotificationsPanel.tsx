import { useMemo } from 'react';
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  Button,
  Divider,
  CircularProgress,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import MarkunreadRoundedIcon from '@mui/icons-material/MarkunreadRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import { Row, Column } from './containers';
import { Notification, NotificationType } from '@entities/Notification';
import { useNavigate } from 'react-router-dom';

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  isMarkingAllRead: boolean;
  unreadCount: number;
}

const ICON_CONFIG: Record<
  NotificationType,
  { icon: React.ReactNode; gradient: string; color: string }
> = {
  NEW_MESSAGE: {
    icon: <MarkunreadRoundedIcon fontSize="small" />,
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
    color: '#2563eb',
  },
  ISSUE_STATUS_CHANGED: {
    icon: <WarningRoundedIcon fontSize="small" />,
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    color: '#ea580c',
  },
  NEW_PAYMENT: {
    icon: <PaymentsRoundedIcon fontSize="small" />,
    gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    color: '#16a34a',
  },
  PAYMENT_REMINDER: {
    icon: <PaymentsRoundedIcon fontSize="small" />,
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: '#d97706',
  },
};

const getTimeAgo = (dateStr: string): string => {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'עכשיו';
  if (minutes < 60) return `לפני ${minutes} דק׳`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `לפני ${hours} שע׳`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'אתמול';
  if (days < 7) return `לפני ${days} ימים`;

  const weeks = Math.floor(days / 7);
  if (weeks === 1) return 'לפני שבוע';
  return `לפני ${weeks} שבועות`;
};

const getNavigationPath = (notification: Notification): string | null => {
  if (!notification.referenceId || !notification.referenceType) return null;

  switch (notification.referenceType) {
    case 'message':
      return '/messages';
    case 'issue':
      return `/issues/${notification.referenceId}`;
    case 'payment':
      return '/payments';
    default:
      return null;
  }
};

const NotificationItem = ({
  notification,
  onMarkAsRead,
  onNavigate,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onNavigate: (path: string) => void;
}) => {
  const config = ICON_CONFIG[notification.type] ?? ICON_CONFIG.NEW_MESSAGE;
  const path = getNavigationPath(notification);

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    if (path) {
      onNavigate(path);
    }
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        px: 2,
        py: 1.5,
        cursor: path ? 'pointer' : 'default',
        position: 'relative',
        transition: 'background-color 180ms ease',
        bgcolor: notification.isRead ? 'transparent' : 'rgba(123, 94, 167, 0.06)',
        '&:hover': {
          bgcolor: 'rgba(123, 94, 167, 0.10)',
        },
      }}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <Box
          sx={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7B5EA7 0%, #533A7B 100%)',
            boxShadow: '0 0 6px rgba(123, 94, 167, 0.4)',
          }}
        />
      )}

      {/* Icon */}
      <Box
        sx={{
          width: 38,
          height: 38,
          minWidth: 38,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: config.gradient,
          color: '#fff',
          boxShadow: `0 4px 12px ${config.color}33`,
          mt: 0.25,
        }}
      >
        {config.icon}
      </Box>

      {/* Content */}
      <Column sx={{ flex: 1, minWidth: 0, gap: 0.25, pr: 2 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: notification.isRead ? 500 : 700,
            lineHeight: 1.4,
            color: 'text.primary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {notification.title}
        </Typography>
        {notification.body && (
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {notification.body}
          </Typography>
        )}
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: '0.7rem',
            mt: 0.25,
          }}
        >
          {getTimeAgo(notification.createdAt)}
        </Typography>
      </Column>
    </Box>
  );
};

export const NotificationsPanel = ({
  open,
  onClose,
  notifications,
  isLoading,
  onMarkAsRead,
  onMarkAllAsRead,
  isMarkingAllRead,
  unreadCount,
}: NotificationsPanelProps) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [notifications],
  );

  return (
    <Drawer
      anchor="top"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          maxHeight: '80vh',
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: 18,
          borderBottomRightRadius: 18,
        },
      }}
    >
      {/* Header */}
      <Row
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Row sx={{ alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            התראות
          </Typography>
          {unreadCount > 0 && (
            <Box
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #7B5EA7 0%, #533A7B 100%)',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 700,
                lineHeight: 1.4,
                minWidth: 22,
                textAlign: 'center',
              }}
            >
              {unreadCount}
            </Box>
          )}
        </Row>

        <Row sx={{ alignItems: 'center', gap: 0.5 }}>
          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={onMarkAllAsRead}
              disabled={isMarkingAllRead}
              startIcon={<DoneAllRoundedIcon />}
              sx={{
                fontSize: '0.75rem',
                color: 'primary.main',
                textTransform: 'none',
              }}
            >
              סמן הכל כנקרא
            </Button>
          )}
          <IconButton size="small" onClick={onClose}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Row>
      </Row>

      {/* Content */}
      <Box sx={{ overflowY: 'auto', pb: 2 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : sortedNotifications.length === 0 ? (
          <Column
            sx={{
              alignItems: 'center',
              justifyContent: 'center',
              py: 6,
              gap: 1,
            }}
          >
            <NotificationsNoneRoundedIcon
              sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.35 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              אין התראות חדשות
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ההתראות שלך יופיעו כאן
            </Typography>
          </Column>
        ) : (
          sortedNotifications.map((notification, index) => (
            <Box key={notification.id}>
              <NotificationItem
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onNavigate={handleNavigate}
              />
              {index < sortedNotifications.length - 1 && (
                <Divider sx={{ mx: 2, opacity: 0.5 }} />
              )}
            </Box>
          ))
        )}
      </Box>
    </Drawer>
  );
};
