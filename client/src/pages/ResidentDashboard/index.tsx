import { apartmentService } from '@api/apartmentService';
import { issuesService } from '@api/issuesService';
import { messageService } from '@api/messageService';
import Banner from '@components/Banner';
import { IssueCard } from '@components/IssueCard';
import { MessageCard } from '@components/MessageCard';
import { useQuery } from '@tanstack/react-query';
import { getBlessingByTime } from '@utils/funcs';
import { useNavigate } from 'react-router-dom';
import { CardList, Column } from '../../components/containers';
import { useAuth } from '../../providers/AuthContext';

export const ResidentDashboard = () => {
  const { user, currentContext } = useAuth();
  const navigate = useNavigate();
  const apartmentId = currentContext?.apartmentId;

  const { data: apartmentData, isLoading: apartmentLoading } = useQuery({
    queryKey: ['apartments', 'by-id', apartmentId],
    queryFn: () => apartmentService.getApartmentById(apartmentId as string),
    enabled: !!apartmentId,
  });

  const { data: latestMessages, isLoading: isLatestMessagesLoading } = useQuery({
    queryKey: ['messages', 'latest', 3, currentContext?.buildingId],
    queryFn: () => messageService.getMessages({ limit: 3, skip: 0 }),
    enabled: !!currentContext,
  });

  const { data: latestIssues, isLoading: isLatestIssuesLoading } = useQuery({
    queryKey: ['issues', 'latest', 3, currentContext?.buildingId],
    queryFn: () => issuesService.getIssues({ limit: 3, skip: 0 }),
    enabled: !!currentContext,
  });

  const apartmentSubtitle = apartmentData
    ? `דירה ${apartmentData.name}`
    : apartmentId
      ? `דירה  ${apartmentId}`
      : 'דירה לא נבחרה';

  return (
    <Column>
      <Banner
        title={`${getBlessingByTime()} ${user?.name || 'דייר'}`}
        subtitle={apartmentSubtitle}
        isLoading={apartmentLoading}
      />
      <Column gap={4}>
        <CardList
          ItemComponent={MessageCard}
          items={latestMessages || []}
          isLoading={isLatestMessagesLoading}
          emptyMessage="אין הודעות להצגה"
          title="הודעות אחרונות"
          onClick={() => navigate('/messages')}
        />
        <CardList
          ItemComponent={IssueCard}
          items={latestIssues || []}
          isLoading={isLatestIssuesLoading}
          emptyMessage="אין תקלות להצגה"
          title="תקלות אחרונות"
          onClick={() => navigate('/issues')}
        />
      </Column>
    </Column>
  );
};
