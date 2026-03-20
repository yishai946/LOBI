import { Column } from '@components/containers';
import { Typography } from '@mui/material';

export const MessagesPage = () => {
  return (
    <Column>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
        הודעות
      </Typography>
      <Typography variant="body1" color="text.secondary">
        כאן תוכל לראות את היסטוריית ההודעות שלך ולנהל את פרטי ההודעה שלך.
      </Typography>
    </Column>
  );
};
