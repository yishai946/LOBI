import { useState, useMemo } from 'react';

interface UsePaginationOptions<T> {
  items: T[];
  defaultPageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

/**
 * Hook for managing pagination state and logic
 * Provides consistent pagination behavior across pages
 */
export const usePagination = <T>({
  items,
  defaultPageSize = 10,
  onPageChange,
  onPageSizeChange,
}: UsePaginationOptions<T>) => {
  const [activePage, setActivePage] = useState(1);
  const [activePageSize, setActivePageSize] = useState(defaultPageSize);

  const handlePageChange = (page: number) => {
    setActivePage(page);
    onPageChange?.(page);
  };

  const handlePageSizeChange = (size: number) => {
    setActivePageSize(size);
    setActivePage(1);
    onPageSizeChange?.(size);
  };

  const pagedItems = useMemo(() => {
    const start = (activePage - 1) * activePageSize;
    return items.slice(start, start + activePageSize);
  }, [items, activePage, activePageSize]);

  return {
    // State
    activePage,
    activePageSize,
    pagedItems,
    totalItems: items.length,
    totalPages: Math.ceil(items.length / activePageSize),

    // Actions
    setActivePage: handlePageChange,
    setActivePageSize: handlePageSizeChange,

    // Utilities
    hasNextPage: activePage < Math.ceil(items.length / activePageSize),
    hasPreviousPage: activePage > 1,
  };
};
