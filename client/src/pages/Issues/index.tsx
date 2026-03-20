import { Column } from '@components/containers';
import { Typography } from '@mui/material';

export const IssuesPage = () => {
  return (
    <Column>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
        תקלות
      </Typography>
      <Typography variant="body1" color="text.secondary">
        כאן תוכל לראות את היסטוריית התקלות שלך ולנהל את פרטי התקלה שלך.
      </Typography>
    </Column>
  );
};
