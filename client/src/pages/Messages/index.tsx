import { messageService } from '@api/messageService';
import Banner from '@components/Banner';
import { MessageCard } from '@components/Cards/MessageCard';
import { CardList, Column } from '@components/containers';
import { ContextType } from '@enums/ContextType';
import { useAuth } from '@providers/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreateMessageDialog } from './CreateMessageDialog';

export const MessagesPage = () => {
  const { currentContext } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const canCreate =
    currentContext?.type === ContextType.MANAGER || currentContext?.type === ContextType.RESIDENT;
  const isCreateRoute = location.pathname === '/messages/new';

  useEffect(() => {
    if (isCreateRoute && canCreate) {
      setCreateDialogOpen(true);
    }
  }, [isCreateRoute, canCreate]);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', currentContext?.buildingId],
    queryFn: () => messageService.getMessages({ limit: 100, sort: 'new' }),
    enabled: Boolean(currentContext),
  });

  const closeCreateDialog = () => {
    setCreateDialogOpen(false);
    if (isCreateRoute) {
      navigate('/messages', { replace: true });
    }
  };

  return (
    <Column gap={3}>
      <Banner
        title="הודעות לבניין"
        subtitle={`סה"כ ${messages.length} הודעות`}
        onButtonClick={canCreate ? () => navigate('/messages/new') : undefined}
        buttonLabel="הודעה חדשה"
      />

      <CardList
        ItemComponent={MessageCard}
        items={messages}
        isLoading={isLoading}
        title="רשימת הודעות"
        emptyMessage="אין הודעות להצגה."
      />

      {canCreate && <CreateMessageDialog open={createDialogOpen} onClose={closeCreateDialog} />}
    </Column>
  );
};
