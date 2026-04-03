import {
  IconButton,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  SelectChangeEvent,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import { CardListSkeleton } from '@skeletons/CardListSkeleton';
import { Column, Row } from './StackContainers';

export interface CardListControlOption {
  label: string;
  value: string;
}

export interface CardListFilterConfig {
  label?: string;
  value: string;
  options: CardListControlOption[];
  onChange: (value: string) => void;
}

export interface CardListSortConfig {
  variant?: 'select' | 'direction-toggle';
  label?: string;
  value: string;
  options?: CardListControlOption[];
  ascValue?: string;
  descValue?: string;
  onChange: (value: string) => void;
}

export interface CardListPaginationConfig {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

interface CardListProps<T extends { id: string | number }> {
  ItemComponent: React.ComponentType<{ item: T }>;
  items: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  title?: string;
  buttonTitle?: string;
  onClick?: () => void;
  skeletonCount?: number;
  filterConfig?: CardListFilterConfig;
  sortConfig?: CardListSortConfig;
  paginationConfig?: CardListPaginationConfig;
}

export const CardList = <T extends { id: string | number }>({
  ItemComponent,
  items,
  isLoading,
  emptyMessage = 'אין פריטים להצגה.',
  title,
  buttonTitle = 'הצג הכל',
  onClick,
  filterConfig,
  sortConfig,
  paginationConfig,
  skeletonCount,
}: CardListProps<T>) => {
  const isDirectionToggleSort = sortConfig?.variant === 'direction-toggle';
  const ascValue = sortConfig?.ascValue;
  const descValue = sortConfig?.descValue;
  const isAscDirection =
    isDirectionToggleSort && sortConfig && ascValue && descValue
      ? sortConfig.value === ascValue
      : false;

  return (
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

      {(filterConfig || sortConfig || paginationConfig) && (
        <Row
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.25,
          }}
        >
          <Row sx={{ gap: 1, flexWrap: 'wrap' }}>
            {filterConfig && filterConfig.options.length > 0 && (
              <FormControl size="small" sx={{ width: 'fit-content' }}>
                <InputLabel>{filterConfig.label || 'סינון'}</InputLabel>
                <Select
                  label={filterConfig.label || 'סינון'}
                  value={filterConfig.value}
                  onChange={(event: SelectChangeEvent) => filterConfig.onChange(event.target.value)}
                  sx={{ pr: 2 }}
                >
                  {filterConfig.options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {sortConfig && isDirectionToggleSort && ascValue && descValue && (
              <Tooltip title={isAscDirection ? 'מיון עולה' : 'מיון יורד'}>
                <IconButton
                  aria-label={sortConfig.label || 'מיון'}
                  color="primary"
                  onClick={() => sortConfig.onChange(isAscDirection ? descValue : ascValue)}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                  }}
                >
                  {isAscDirection ? <ArrowUpwardRoundedIcon /> : <ArrowDownwardRoundedIcon />}
                </IconButton>
              </Tooltip>
            )}

            {sortConfig && !isDirectionToggleSort && (sortConfig.options?.length || 0) > 0 && (
              <FormControl size="small" sx={{ width: 'fit-content' }}>
                <InputLabel>{sortConfig.label || 'מיון'}</InputLabel>
                <Select
                  label={sortConfig.label || 'מיון'}
                  value={sortConfig.value}
                  onChange={(event: SelectChangeEvent) => sortConfig.onChange(event.target.value)}
                  sx={{ pr: 2 }}
                >
                  {sortConfig.options?.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Row>

          {paginationConfig && paginationConfig.onPageSizeChange && (
            <FormControl size="small" sx={{ width: 'fit-content' }}>
              <InputLabel>גודל עמוד</InputLabel>
              <Select
                label="גודל עמוד"
                value={String(paginationConfig.pageSize)}
                onChange={(event: SelectChangeEvent) =>
                  paginationConfig.onPageSizeChange?.(Number(event.target.value))
                }
                sx={{ pr: 4 }}
              >
                {(paginationConfig.pageSizeOptions || [3, 5, 10]).map((size) => (
                  <MenuItem key={size} value={String(size)}>
                    {size}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Row>
      )}
      {isLoading ? (
        <CardListSkeleton count={skeletonCount} />
      ) : items.length == 0 ? (
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
        </Typography>
      ) : (
        <>
          {items.map((item) => (
            <ItemComponent key={item.id} item={item} />
          ))}
          {paginationConfig &&
            Math.ceil(paginationConfig.totalItems / paginationConfig.pageSize) > 1 && (
              <Row sx={{ justifyContent: 'center', pt: 0.5 }}>
                <Pagination
                  shape="rounded"
                  color="primary"
                  page={paginationConfig.page}
                  count={Math.ceil(paginationConfig.totalItems / paginationConfig.pageSize)}
                  onChange={(_event, page) => paginationConfig.onPageChange(page)}
                />
              </Row>
            )}
        </>
      )}
    </Column>
  );
};
