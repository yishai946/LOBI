import { ContextType } from '@enums/ContextType';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import { Navigate } from 'react-router-dom';
import { lazy, ReactNode } from 'react';

const HomePage = lazy(() =>
  import('@pages/Home/HomePage').then((module) => ({ default: module.HomePage }))
);
const LoginPage = lazy(() =>
  import('@pages/Login/LoginPage').then((module) => ({ default: module.LoginPage }))
);
const OtpPage = lazy(() =>
  import('@pages/Login/OtpPage').then((module) => ({ default: module.OtpPage }))
);
const CompleteProfilePage = lazy(() =>
  import('@pages/Login/CompleteProfilePage').then((module) => ({
    default: module.CompleteProfilePage,
  }))
);
const ContextSelectionPage = lazy(() =>
  import('@pages/ContextSelection/ContextSelectionPage').then((module) => ({
    default: module.ContextSelectionPage,
  }))
);
const UnauthorizedPage = lazy(() =>
  import('@pages/Unauthorized/UnauthorizedPage').then((module) => ({
    default: module.UnauthorizedPage,
  }))
);
const NotFoundPage = lazy(() =>
  import('@pages/NotFound/NotFoundPage').then((module) => ({ default: module.NotFoundPage }))
);

export interface PageDefinition {
  path: string;
  element: ReactNode;
  title?: string;
  icon?: ReactNode;
  isVisibleInMenu: boolean;
  isProtected?: boolean;
  allowedRoles?: ContextType[];
  isPublicOnly?: boolean;
  requireContext?: boolean;
  redirectIfContextSelected?: boolean;
}

const Pages: PageDefinition[] = [
  {
    path: '/',
    element: <Navigate to="/home" replace />,
    isVisibleInMenu: false,
  },
  {
    path: '/home',
    element: <HomePage />,
    title: 'בית',
    icon: <HomeRoundedIcon />,
    isVisibleInMenu: true,
    isProtected: true,
    requireContext: true,
  },
  {
    path: '/login',
    element: <LoginPage />,
    isVisibleInMenu: false,
    isPublicOnly: true,
  },
  {
    path: '/otp',
    element: <OtpPage />,
    isVisibleInMenu: false,
    isPublicOnly: true,
  },
  {
    path: '/complete-profile',
    element: <CompleteProfilePage />,
    isVisibleInMenu: false,
    isProtected: true,
    redirectIfContextSelected: true,
  },
  {
    path: '/select-context',
    element: <ContextSelectionPage />,
    isVisibleInMenu: false,
    isProtected: true,
    redirectIfContextSelected: true,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
    isVisibleInMenu: false,
    isProtected: true,
    requireContext: true,
  },
  {
    path: '*',
    element: <NotFoundPage />,
    isVisibleInMenu: false,
  },
];

export default Pages;
