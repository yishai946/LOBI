import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import MarkunreadRoundedIcon from '@mui/icons-material/MarkunreadRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import DevicesRoundedIcon from '@mui/icons-material/DevicesRounded';
import { Row } from '@components/containers';
import { usePushNotifications } from '@hooks/usePushNotifications';
import { usePushSettings } from '@hooks/usePushSettings';

export const NotificationSettings = () => {
  const { subscribeUser, unsubscribeUser, isSubscribing } = usePushNotifications();
  const { settings, isLoading, error, updateSettings, isUpdating } = usePushSettings();
  const [isPushEnabled, setIsPushEnabled] = useState(false);

  useEffect(() => {
    const checkPushStatus = async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsPushEnabled(!!subscription);
      }
    };
    checkPushStatus();
  }, []);

  const handleTogglePush = async () => {
    if (isPushEnabled) {
      const success = await unsubscribeUser();
      if (success) setIsPushEnabled(false);
    } else {
      const success = await subscribeUser();
      if (success) setIsPushEnabled(true);
    }
  };

  const handleToggleSetting = (key: 'notifyOnMessages' | 'notifyOnIssues' | 'notifyOnPayments') => {
    if (!settings) return;
    updateSettings({ [key]: !settings[key] });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
        הגדרות התראות
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          שגיאה בטעינת הגדרות
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Row sx={{ alignItems: 'center', gap: 2 }}>
          <ListItemIcon sx={{ minWidth: 0, color: 'primary.main' }}>
            <DevicesRoundedIcon />
          </ListItemIcon>
          <ListItemText 
            primary="התראות דחיפה (Push)" 
            secondary="קבל התראות ישירות למכשיר שלך גם כשהאפליקציה סגורה" 
          />
          <Switch 
            edge="end" 
            checked={isPushEnabled} 
            onChange={handleTogglePush}
            disabled={isSubscribing}
          />
        </Row>
      </Paper>

      <Typography variant="subtitle2" sx={{ mb: 1, ml: 1, color: 'text.secondary', fontWeight: 600 }}>
        בחר אילו התראות תרצה לקבל:
      </Typography>

      <Paper sx={{ borderRadius: 3, opacity: isPushEnabled ? 1 : 0.6, transition: 'opacity 0.2s' }}>
        <List disablePadding>
          <ListItem sx={{ py: 2 }}>
            <ListItemIcon sx={{ color: '#2563eb' }}>
              <MarkunreadRoundedIcon />
            </ListItemIcon>
            <ListItemText primary="הודעות חדשות" secondary="עדכונים על הודעות ותקשורת בבניין" />
            <Switch 
              checked={isPushEnabled ? (settings?.notifyOnMessages ?? false) : false} 
              onChange={() => handleToggleSetting('notifyOnMessages')}
              disabled={!isPushEnabled || isUpdating}
            />
          </ListItem>
          <Divider variant="inset" component="li" />
          
          <ListItem sx={{ py: 2 }}>
            <ListItemIcon sx={{ color: '#ea580c' }}>
              <WarningRoundedIcon />
            </ListItemIcon>
            <ListItemText primary="עדכוני תקלות" secondary="שינוי סטטוס בתקלות שמרכזות את עניינך" />
            <Switch 
              checked={isPushEnabled ? (settings?.notifyOnIssues ?? false) : false} 
              onChange={() => handleToggleSetting('notifyOnIssues')}
              disabled={!isPushEnabled || isUpdating}
            />
          </ListItem>
          <Divider variant="inset" component="li" />

          <ListItem sx={{ py: 2 }}>
            <ListItemIcon sx={{ color: '#16a34a' }}>
              <PaymentsRoundedIcon />
            </ListItemIcon>
            <ListItemText primary="תשלומים" secondary="דרישות תשלום חדשות ותזכורות" />
            <Switch 
              checked={isPushEnabled ? (settings?.notifyOnPayments ?? false) : false} 
              onChange={() => handleToggleSetting('notifyOnPayments')}
              disabled={!isPushEnabled || isUpdating}
            />
          </ListItem>
        </List>
      </Paper>

      {!isPushEnabled && (
        <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
          יש להפעיל את התראות הדחיפה במכשיר כדי לנהל את סוגי ההתראות.
        </Alert>
      )}

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          שים לב: חלק מההתראות הקריטיות עשויות להישלח בכל מקרה כדי להבטיח את תקינות השירות.
        </Typography>
      </Box>
    </Box>
  );
};
