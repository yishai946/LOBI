import { Button, Typography } from '@mui/material';
import { CardListSkeleton } from '@skeletons/CardListSkeleton';
import { Column, Row } from './StackContainers';

interface CardListProps<T extends { id: string | number }> {
  ItemComponent: React.ComponentType<{ item: T }>;
  items: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  title?: string;
  buttonTitle?: string;
  onClick?: () => void;
}

export const CardList = <T extends { id: string | number }>({
  ItemComponent,
  items,
  isLoading,
  emptyMessage = 'אין פריטים להצגה.',
  title,
  buttonTitle = 'הצג הכל',
  onClick,
}: CardListProps<T>) =>
  isLoading ? (
    <CardListSkeleton title={title} />
  ) : (
    <Column gap={2}>
      {title && (
        <Row justifyContent="space-between" alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {title}
          </Typography>
          {onClick && (
            <Button size="small" variant="text" onClick={onClick}>
              {buttonTitle}
            </Button>
          )}
        </Row>
      )}
      {items.length > 0 ? (
        items.map((item) => <ItemComponent key={item.id} item={item} />)
      ) : (
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
        </Typography>
      )}
    </Column>
  );
