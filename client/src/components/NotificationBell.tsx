import { useState } from 'react';
import { Badge, IconButton } from '@mui/material';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import { useNotifications } from '@hooks/useNotifications';
import { NotificationsPanel } from './NotificationsPanel';

export const NotificationBell = () => {
  const [panelOpen, setPanelOpen] = useState(false);

  const {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isMarkingAllRead,
  } = useNotifications();

  return (
    <>
      <IconButton
        id="notification-bell"
        size="small"
        onClick={() => setPanelOpen(true)}
        sx={{
          position: 'relative',
          p: 1,
          borderRadius: 2,
          transition: 'background-color 180ms ease',
          '&:hover': {
            bgcolor: 'rgba(123, 94, 167, 0.10)',
          },
        }}
      >
        <Badge
          badgeContent={unreadCount}
          max={99}
          sx={{
            '& .MuiBadge-badge': {
              background: 'linear-gradient(135deg, #7B5EA7 0%, #533A7B 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.65rem',
              minWidth: 18,
              height: 18,
              boxShadow: '0 2px 8px rgba(123, 94, 167, 0.4)',
              animation: unreadCount > 0 ? 'pulse-badge 2s infinite' : 'none',
              '@keyframes pulse-badge': {
                '0%, 100%': {
                  boxShadow: '0 2px 8px rgba(123, 94, 167, 0.4)',
                },
                '50%': {
                  boxShadow: '0 2px 14px rgba(123, 94, 167, 0.7)',
                },
              },
            },
          }}
        >
          <NotificationsRoundedIcon
            sx={{
              color: 'text.primary',
              fontSize: 24,
            }}
          />
        </Badge>
      </IconButton>

      <NotificationsPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        notifications={notifications}
        isLoading={isLoading}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        isMarkingAllRead={isMarkingAllRead}
        unreadCount={unreadCount}
      />
    </>
  );
};
