import { Column } from '@components/containers';
import { Typography } from '@mui/material';

export const PaymentsPage = () => {
  return (
    <Column>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
        תשלומים
      </Typography>
      <Typography variant="body1" color="text.secondary">
        כאן תוכל לראות את היסטוריית התשלומים שלך ולנהל את פרטי התשלום שלך.
      </Typography>
    </Column>
  );
};
