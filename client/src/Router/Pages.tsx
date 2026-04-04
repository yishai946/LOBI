import { ContextType } from '@enums/ContextType';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import IssuesRoundedIcon from '@mui/icons-material/WarningRounded';
import MessagesRoundedIcon from '@mui/icons-material/MarkunreadRounded';
import { Navigate } from 'react-router-dom';
import { lazy, ReactNode } from 'react';

const HomePage = lazy(() =>
  import('@pages/ResidentDashboard').then((module) => ({ default: module.ResidentDashboard }))
);
const IssuesPage = lazy(() =>
  import('@pages/Issues').then((module) => ({ default: module.IssuesPage }))
);
const IssueDetailsPage = lazy(() =>
  import('@pages/Issues/IssueDetailsPage').then((module) => ({
    default: module.IssueDetailsPage,
  }))
);
const MessagesPage = lazy(() =>
  import('@pages/Messages').then((module) => ({ default: module.MessagesPage }))
);
const PaymentsPage = lazy(() =>
  import('@pages/Payments').then((module) => ({ default: module.PaymentsPage }))
);
const PaymentSuccessPage = lazy(() =>
  import('@pages/Payments/PaymentSuccessPage').then((module) => ({
    default: module.PaymentSuccessPage,
  }))
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
const NotificationSettingsPage = lazy(() =>
  import('@pages/NotificationSettings').then((module) => ({ default: module.NotificationSettings }))
);
const ResidentsApartmentsPage = lazy(() =>
  import('@pages/ResidentsApartments').then((module) => ({
    default: module.ResidentsApartmentsPage,
  }))
);
const UpgradePage = lazy(() =>
  import('@pages/Upgrade').then((module) => ({ default: module.UpgradePage }))
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
    path: '/payments',
    element: <PaymentsPage />,
    title: 'תשלומים',
    icon: <PaymentsRoundedIcon />,
    isVisibleInMenu: true,
    isProtected: true,
    requireContext: true,
  },
  {
    path: '/payments/success',
    element: <PaymentSuccessPage />,
    isVisibleInMenu: false,
  },
  {
    path: '/payments/new',
    element: <PaymentsPage />,
    isVisibleInMenu: false,
    isProtected: true,
    requireContext: true,
    allowedRoles: [ContextType.MANAGER, ContextType.ADMIN],
  },
  {
    path: '/issues',
    element: <IssuesPage />,
    title: 'תקלות',
    icon: <IssuesRoundedIcon />,
    isVisibleInMenu: true,
    isProtected: true,
    requireContext: true,
  },
  {
    path: '/issues/new',
    element: <IssuesPage />,
    isVisibleInMenu: false,
    isProtected: true,
    requireContext: true,
  },
  {
    path: '/issues/:issueId',
    element: <IssueDetailsPage />,
    isVisibleInMenu: false,
    isProtected: true,
    requireContext: true,
  },
  {
    path: '/messages',
    element: <MessagesPage />,
    title: 'הודעות',
    icon: <MessagesRoundedIcon />,
    isVisibleInMenu: true,
    isProtected: true,
    requireContext: true,
  },
  {
    path: '/messages/new',
    element: <MessagesPage />,
    isVisibleInMenu: false,
    isProtected: true,
    requireContext: true,
  },
  {
    path: '/residents-apartments',
    element: <ResidentsApartmentsPage />,
    title: 'דיירים ודירות',
    icon: <ApartmentRoundedIcon />,
    isVisibleInMenu: true,
    isProtected: true,
    requireContext: true,
    allowedRoles: [ContextType.MANAGER, ContextType.ADMIN],
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
    path: '/settings/notifications',
    element: <NotificationSettingsPage />,
    isVisibleInMenu: false,
    isProtected: true,
    requireContext: true,
  },
  {
    path: '/upgrade',
    element: <UpgradePage />,
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
