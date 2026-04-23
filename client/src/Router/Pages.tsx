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
  visibleInTabsToRoles?: ContextType[];
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
  },
  {
    path: '/home',
    element: <HomePage />,
    title: 'בית',
    icon: <HomeRoundedIcon />,
    visibleInTabsToRoles: [ContextType.RESIDENT, ContextType.MANAGER, ContextType.ADMIN],
    isProtected: true,
    requireContext: true,
  },
  {
    path: '/payments',
    element: <PaymentsPage />,
    title: 'תשלומים',
    icon: <PaymentsRoundedIcon />,
    visibleInTabsToRoles: [ContextType.RESIDENT, ContextType.MANAGER, ContextType.ADMIN],
    isProtected: true,
    requireContext: true,
  },
  {
    path: '/payments/success',
    element: <PaymentSuccessPage />,
  },
  {
    path: '/payments/new',
    element: <PaymentsPage />,
    isProtected: true,
    requireContext: true,
    allowedRoles: [ContextType.MANAGER, ContextType.ADMIN],
  },
  {
    path: '/issues',
    element: <IssuesPage />,
    title: 'תקלות',
    icon: <IssuesRoundedIcon />,
    visibleInTabsToRoles: [ContextType.RESIDENT, ContextType.MANAGER, ContextType.ADMIN],
    isProtected: true,
    requireContext: true,
  },
  {
    path: '/issues/new',
    element: <IssuesPage />,
    isProtected: true,
    requireContext: true,
  },
  {
    path: '/issues/:issueId',
    element: <IssueDetailsPage />,
    isProtected: true,
    requireContext: true,
  },
  {
    path: '/messages',
    element: <MessagesPage />,
    title: 'הודעות',
    icon: <MessagesRoundedIcon />,
    visibleInTabsToRoles: [ContextType.RESIDENT, ContextType.ADMIN],
    isProtected: true,
    requireContext: true,
  },
  {
    path: '/messages/new',
    element: <MessagesPage />,
    isProtected: true,
    requireContext: true,
  },
  {
    path: '/residents-apartments',
    element: <ResidentsApartmentsPage />,
    title: 'בניין',
    icon: <ApartmentRoundedIcon />,
    visibleInTabsToRoles: [ContextType.MANAGER],
    isProtected: true,
    requireContext: true,
    allowedRoles: [ContextType.MANAGER, ContextType.ADMIN],
  },
  {
    path: '/login',
    element: <LoginPage />,
    isPublicOnly: true,
  },
  {
    path: '/otp',
    element: <OtpPage />,
    isPublicOnly: true,
  },
  {
    path: '/complete-profile',
    element: <CompleteProfilePage />,
    isProtected: true,
    redirectIfContextSelected: true,
  },
  {
    path: '/select-context',
    element: <ContextSelectionPage />,
    isProtected: true,
    redirectIfContextSelected: true,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
    isProtected: true,
    requireContext: true,
  },
  {
    path: '/settings/notifications',
    element: <NotificationSettingsPage />,
    isProtected: true,
    requireContext: true,
  },
  {
    path: '/upgrade',
    element: <UpgradePage />,
    isProtected: true,
    requireContext: true,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

export default Pages;
