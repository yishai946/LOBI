import AddIcon from '@mui/icons-material/Add';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import MarkunreadRoundedIcon from '@mui/icons-material/MarkunreadRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded';
import {
  Backdrop,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Fab,
  Paper,
  Typography,
} from '@mui/material';
import { ContextType } from '@enums/ContextType';
import { useAuth } from '@providers/AuthContext';
import { ReactNode, useMemo, useState } from 'react';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import Pages from './Pages';

interface QuickAction {
  key: string;
  name: string;
  icon: ReactNode;
  path: string;
  allowedRoles: ContextType[];
  gradient: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    key: 'new-payment',
    name: 'תשלום חדש',
    icon: <PaymentsRoundedIcon />,
    path: '/payments/new',
    allowedRoles: [ContextType.MANAGER, ContextType.ADMIN],
    gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
  },
  {
    key: 'new-issue',
    name: 'דיווח תקלה',
    icon: <ReportProblemRoundedIcon />,
    path: '/issues/new',
    allowedRoles: [ContextType.RESIDENT, ContextType.MANAGER, ContextType.ADMIN],
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
  },
  {
    key: 'new-message',
    name: 'הודעה חדשה',
    icon: <MarkunreadRoundedIcon />,
    path: '/messages/new',
    allowedRoles: [ContextType.RESIDENT, ContextType.MANAGER, ContextType.ADMIN],
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
  },
];

const getActionAngle = (index: number, total: number): number => {
  if (total <= 1) {
    return -90;
  }

  if (total === 2) {
    return index === 0 ? -120 : -60;
  }

  const spread = 120;
  const start = -90 - spread / 2;
  const step = spread / (total - 1);

  return start + step * index;
};

const Tabs = () => {
  const { currentContext, isAuthenticated } = useAuth();
  const contextType = currentContext?.type;
  const [isDialOpen, setIsDialOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const quickActions = useMemo(() => {
    if (!contextType) {
      return [];
    }

    return QUICK_ACTIONS.filter((action) => action.allowedRoles.includes(contextType));
  }, [contextType]);

  if (!isAuthenticated || !contextType) {
    return null;
  }

  const navigationPages = Pages.filter(
    (page) =>
      page.isProtected &&
      page.visibleInTabsToRoles &&
      page.visibleInTabsToRoles.includes(contextType) &&
      (!page.allowedRoles || page.allowedRoles.includes(contextType))
  );

  if (navigationPages.length === 0) {
    return null;
  }

  const currentNavigationPath =
    navigationPages.find((page) => matchPath({ path: page.path, end: false }, location.pathname))
      ?.path ?? false;

  const midpoint = Math.ceil(navigationPages.length / 2);
  const leftPages = navigationPages.slice(0, midpoint);
  const rightPages = navigationPages.slice(midpoint);
  const fanRadius = 126;
  const centerFabSize = 60;
  const actionFabSize = 56;

  return (
    <Box
      sx={{
        position: 'fixed',
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      <Backdrop
        open={isDialOpen}
        onClick={() => setIsDialOpen(false)}
        sx={{
          position: 'fixed',
          zIndex: 1,
          bgcolor: 'rgba(15, 23, 42, 0.28)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      />

      <Paper
        elevation={10}
        sx={{
          position: 'relative',
          zIndex: 2,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.42)',
          bgcolor: 'rgba(255, 255, 255, 0.26)',
          backdropFilter: 'blur(14px) saturate(145%)',
          WebkitBackdropFilter: 'blur(14px) saturate(145%)',
          boxShadow:
            '0 1px 0 rgba(255, 255, 255, 0.32) inset, 0 -16px 36px rgba(15, 23, 42, 0.2), 0 -6px 16px rgba(15, 23, 42, 0.12)',
        }}
      >
        <BottomNavigation
          showLabels
          value={currentNavigationPath}
          onChange={(_, nextPath: string) => {
            if (nextPath !== location.pathname) {
              navigate(nextPath);
            }
          }}
          sx={{
            height: 68,
            backgroundColor: 'transparent',
            '& .MuiBottomNavigationAction-root': {
              minWidth: 64,
            },
          }}
        >
          {leftPages.map((page) => (
            <BottomNavigationAction
              key={page.path}
              value={page.path}
              label={page.title}
              icon={page.icon}
            />
          ))}

          <BottomNavigationAction
            disabled
            icon={<span />}
            label=""
            sx={{
              minWidth: 72,
              maxWidth: 72,
              pointerEvents: 'none',
              '& .MuiBottomNavigationAction-label': {
                display: 'none',
              },
            }}
          />

          {rightPages.map((page) => (
            <BottomNavigationAction
              key={page.path}
              value={page.path}
              label={page.title}
              icon={page.icon}
            />
          ))}
        </BottomNavigation>
      </Paper>

      {quickActions.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            bottom: isDialOpen ? 56 : 34,
            transform: 'translateX(-50%)',
            zIndex: 3,
            width: centerFabSize,
            height: centerFabSize,
            transition: 'bottom 220ms ease',
          }}
        >
          {quickActions.map((action, index) => {
            const actionAngle = getActionAngle(index, quickActions.length);

            return (
              <Box
                key={action.key}
                sx={{
                  position: 'absolute',
                  left: centerFabSize / 2,
                  top: centerFabSize / 2,
                  width: 0,
                  height: 0,
                  transform: isDialOpen
                    ? `translate(-50%, -50%) translate(${Math.cos((actionAngle * Math.PI) / 180) * fanRadius}px, ${Math.sin((actionAngle * Math.PI) / 180) * fanRadius}px)`
                    : 'translate(-50%, -50%) translate(0, 0)',
                  opacity: isDialOpen ? 1 : 0,
                  transition: 'transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 180ms ease',
                  pointerEvents: isDialOpen ? 'auto' : 'none',
                }}
              >
                <Fab
                  size="medium"
                  onClick={() => {
                    setIsDialOpen(false);
                    navigate(action.path);
                  }}
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    transform: 'translate(-50%, -50%)',
                    width: actionFabSize,
                    height: actionFabSize,
                    color: '#fff',
                    background: action.gradient,
                    boxShadow: '0 10px 24px rgba(2, 6, 23, 0.28)',
                    '&:hover': {
                      filter: 'brightness(1.05)',
                      boxShadow: '0 14px 28px rgba(2, 6, 23, 0.35)',
                    },
                  }}
                >
                  {action.icon}
                </Fab>

                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: 38,
                    transform: 'translateX(-50%)',
                    px: 0.8,
                    py: 0.25,
                    borderRadius: 1.5,
                    bgcolor: 'rgba(31, 41, 55, 0.92)',
                    color: '#fff',
                    boxShadow: '0 8px 18px rgba(15, 23, 42, 0.28)',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Typography sx={{ fontWeight: 700, lineHeight: 1, fontSize: 11 }}>
                    {action.name}
                  </Typography>
                </Box>
              </Box>
            );
          })}

          <Fab
            onClick={() => setIsDialOpen((prev) => !prev)}
            sx={{
              width: 60,
              height: 60,
              bgcolor: 'primary.dark',
              color: 'primary.contrastText',
              boxShadow: isDialOpen
                ? '0 14px 28px rgba(30, 58, 138, 0.42)'
                : '0 10px 24px rgba(30, 58, 138, 0.35)',
              transition: 'box-shadow 220ms ease, background-color 220ms ease',
              '&:hover': { bgcolor: 'primary.main' },
            }}
          >
            {isDialOpen ? <CloseRoundedIcon /> : <AddIcon />}
          </Fab>
        </Box>
      )}
    </Box>
  );
};

export default Tabs;
