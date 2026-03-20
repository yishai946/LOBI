import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { useLocation, useNavigate, matchPath } from 'react-router-dom';
import Pages from './Pages';

const Tabs = () => {
  const navigationPages = Pages.filter((page) => page.isProtected && page.isVisibleInMenu);

  const location = useLocation();
  const navigate = useNavigate();
  const currentNavigationPath =
    navigationPages.find((page) => matchPath({ path: page.path, end: false }, location.pathname))
      ?.path ?? false;

  <Paper
    elevation={8}
    sx={{
      position: 'fixed',
      right: 0,
      bottom: 0,
      left: 0,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      overflow: 'hidden',
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
    >
      {navigationPages.map((page) => (
        <BottomNavigationAction
          key={page.path}
          value={page.path}
          label={page.title}
          icon={page.icon}
        />
      ))}
    </BottomNavigation>
  </Paper>;
};

export default Tabs;