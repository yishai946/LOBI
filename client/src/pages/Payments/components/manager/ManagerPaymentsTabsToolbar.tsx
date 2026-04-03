import { Button, Divider, Tab, Tabs } from '@mui/material';

import { Row } from '@components/containers';

import { ManagerTab } from './managerPayments.types';

interface ManagerPaymentsTabsToolbarProps {
  activeTab: ManagerTab;
  onTabChange: (value: ManagerTab) => void;
  onCreatePayment: () => void;
  onCreateRecurring: () => void;
}

const ManagerPaymentsTabsToolbar = ({
  activeTab,
  onTabChange,
  onCreatePayment,
  onCreateRecurring,
}: ManagerPaymentsTabsToolbarProps) => (
  <>
    <Row sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
      <Tabs value={activeTab} onChange={(_event, value: ManagerTab) => onTabChange(value)}>
        <Tab label="חיובים" value="oneTime" />
        <Tab label="סדרות קבועות" value="recurring" />
      </Tabs>

      {activeTab === 'oneTime' ? (
        <Button variant="contained" onClick={onCreatePayment}>
          חיוב חדש
        </Button>
      ) : (
        <Button variant="contained" onClick={onCreateRecurring}>
          סדרה חדשה
        </Button>
      )}
    </Row>

    <Divider sx={{ mb: 2 }} />
  </>
);

export default ManagerPaymentsTabsToolbar;
