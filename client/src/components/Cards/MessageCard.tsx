import { Card, Row } from '@components/containers';
import { Message as MessageType } from '@entities/Message';
import CampaignIcon from '@mui/icons-material/Campaign';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import { Typography } from '@mui/material';
import { getTimePassedMessage } from '@utils/funcs';

interface MessageProps {
  item: MessageType;
}

export const MessageCard = ({ item }: MessageProps) => (
  <Card isError={item.isUrgent}>
    <Row sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
        {item.title}
      </Typography>
      {item.isUrgent ? <PriorityHighIcon color="error" /> : <CampaignIcon />}
    </Row>
    <Typography variant="body2" color="text.secondary" pb={1}>
      {getTimePassedMessage(item.createdAt)}
    </Typography>
    <Typography variant="body2">{item.content}</Typography>
  </Card>
);
