import { issuesService, type IssueStatusParam } from '@api/issuesService';
import Banner from '@components/Banner';
import { IssueCard } from '@components/Cards/IssueCard';
import { CardList, Column } from '@components/containers';
import { Issue } from '@entities/Issue';
import { ContextType } from '@enums/ContextType';
import { Box, Typography } from '@mui/material';
import { useAuth } from '@providers/AuthContext';
import { useGlobalMessage } from '@providers/MessageProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreateIssueDialog } from './CreateIssueDialog';

type IssuesFilter = 'all' | IssueStatusParam;
type IssuesSort = 'new' | 'old';

export const IssuesPage = () => {
  const { currentContext } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeFilter, setActiveFilter] = useState<IssuesFilter>('all');
  const [activeSort, setActiveSort] = useState<IssuesSort>('new');
  const [activePage, setActivePage] = useState(1);
  const [activePageSize, setActivePageSize] = useState(5);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const isCreateRoute = location.pathname === '/issues/new';
  const canManage =
    currentContext?.type === ContextType.MANAGER || currentContext?.type === ContextType.ADMIN;

  useEffect(() => {
    if (isCreateRoute) {
      setCreateDialogOpen(true);
    }
  }, [isCreateRoute]);

  const queryStatus = activeFilter === 'all' ? undefined : activeFilter;

  const { data: allIssues = [], isLoading: isIssuesLoading } = useQuery({
    queryKey: ['issues', 'list', currentContext?.buildingId, queryStatus, activeSort],
    queryFn: () =>
      issuesService.getIssues({
        limit: 200,
        status: queryStatus,
        sort: activeSort,
      }),
    enabled: !!currentContext,
  });

  const start = (activePage - 1) * activePageSize;

  const pagedIssues = useMemo(
    () => allIssues.slice(start, start + activePageSize),
    [allIssues, start, activePageSize]
  );

  const closeCreateDialog = () => {
    setCreateDialogOpen(false);

    if (isCreateRoute) {
      navigate('/issues', { replace: true });
    }
  };

  const inProgressIssuesCount = allIssues.filter((issue) => issue.status === 'inProgress').length;
  const notDoneIssuesCount = allIssues.filter((issue) => issue.status !== 'done').length;

  return (
    <Column gap={3}>
      <Banner
        title={`יש ${notDoneIssuesCount} תקלות פתוחות`}
        subtitle={`מתוכן ${inProgressIssuesCount} ביטיפול`}
        onButtonClick={() => navigate('/issues/new')}
        buttonLabel="תקלה חדשה"
      />
      <CardList
        ItemComponent={IssueCard}
        items={pagedIssues}
        isLoading={isIssuesLoading}
        title="רשימת תקלות"
        emptyMessage="אין תקלות להצגה."
        skeletonCount={5}
        filterConfig={{
          label: 'סטטוס',
          value: activeFilter,
          options: [
            { label: 'הכל', value: 'all' },
            { label: 'פתוח', value: 'open' },
            { label: 'בטיפול', value: 'inProgress' },
            { label: 'טופל', value: 'done' },
          ],
          onChange: (value) => {
            setActiveFilter(value as IssuesFilter);
            setActivePage(1);
          },
        }}
        sortConfig={{
          label: 'מיון',
          value: activeSort,
          options: [
            { label: 'חדש', value: 'new' },
            { label: 'ישן', value: 'old' },
          ],
          onChange: (value) => {
            setActiveSort(value as IssuesSort);
            setActivePage(1);
          },
        }}
        paginationConfig={{
          page: activePage,
          pageSize: activePageSize,
          totalItems: allIssues.length,
          onPageChange: setActivePage,
          onPageSizeChange: (size) => {
            setActivePageSize(size);
            setActivePage(1);
          },
          pageSizeOptions: [3, 5, 10],
        }}
      />
      <CreateIssueDialog open={createDialogOpen} onClose={closeCreateDialog} />
    </Column>
  );
};
