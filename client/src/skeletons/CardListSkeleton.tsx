import { Column } from '@components/containers';
import { CardSkeleton } from './CardSkeleton';

interface CardListSkeletonProps {
  count?: number;
}

export const CardListSkeleton = ({ count = 2 }: CardListSkeletonProps) => (
  <Column gap={2}>
    {Array.from({ length: count }).map((_, index) => (
      <CardSkeleton key={index} />
    ))}
  </Column>
);
