import { useEffect, useMemo, useState } from 'react';
import { Apartment } from '@entities/Apartment';
import { Resident } from '@entities/Resident';
import {
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import { Row, Column, Card } from '@components/containers';

interface ResidentsListProps {
  residents: Resident[];
  apartments: Apartment[];
  selectedApartmentId: string | null;
  selectedFloorNumber: string;
  selectedListApartmentId: string;
  search: string;
  isLoading: boolean;
  canManage: boolean;
  onFloorChange: (floorNumber: string) => void;
  onApartmentChange: (apartmentId: string) => void;
  onSearchChange: (search: string) => void;
  onSelectApartment: (apartmentId: string) => void;
  onMoveResident: (resident: Resident) => void;
  onDeleteResident: (resident: Resident) => void;
}

const formatApartmentLabel = (apartment: Apartment) => {
  const floor = apartment.floorNumber ?? '-';
  const number = apartment.apartmentNumber ?? '-';
  return `קומה ${floor} · דירה ${number}`;
};

export const ResidentsList = ({
  residents,
  apartments,
  selectedApartmentId,
  selectedFloorNumber,
  selectedListApartmentId,
  search,
  isLoading,
  canManage,
  onFloorChange,
  onApartmentChange,
  onSearchChange,
  onSelectApartment,
  onMoveResident,
  onDeleteResident,
}: ResidentsListProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const residentsPerPage = isMobile ? 5 : 10;
  const [page, setPage] = useState(1);

  const floors = useMemo(
    () =>
      Array.from(
        new Set(
          apartments
            .map((apartment) => apartment.floorNumber)
            .filter((floorNumber): floorNumber is number => floorNumber !== null && floorNumber !== undefined)
        )
      ).sort((a, b) => a - b),
    [apartments]
  );

  const apartmentsForSelectedFloor = useMemo(
    () =>
      selectedFloorNumber
        ? apartments.filter((apartment) => String(apartment.floorNumber) === selectedFloorNumber)
        : [],
    [apartments, selectedFloorNumber]
  );

  const filteredResidents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return residents.filter((resident) => {
      const matchesFloor =
        !selectedFloorNumber || String(resident.apartment.floorNumber) === selectedFloorNumber;
      const matchesApartment =
        !selectedListApartmentId || resident.apartmentId === selectedListApartmentId;
      const name = resident.user.name?.toLowerCase() || '';
      const phone = resident.user.phone.toLowerCase();
      const matchesSearch = !term || name.includes(term) || phone.includes(term);
      return matchesFloor && matchesApartment && matchesSearch;
    });
  }, [residents, search, selectedFloorNumber, selectedListApartmentId]);

  const totalPages = Math.max(1, Math.ceil(filteredResidents.length / residentsPerPage));

  useEffect(() => {
    setPage(1);
  }, [selectedFloorNumber, selectedListApartmentId, search]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const visibleResidents = useMemo(
    () => filteredResidents.slice((page - 1) * residentsPerPage, page * residentsPerPage),
    [filteredResidents, page, residentsPerPage]
  );

  return (
    <Card>
      <Row alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          רשימת דיירים
        </Typography>
        <Chip
          label={isLoading ? 'טעינה…' : `${filteredResidents.length} דיירים`}
          size="small"
          sx={{ bgcolor: 'rgba(20,184,166,0.12)', fontWeight: 700 }}
        />
      </Row>
      <Row gap={1.5} direction={{ xs: 'column', sm: 'row' }} sx={{ mb: 2 }}>
        <FormControl size="small" fullWidth>
          <InputLabel>קומה</InputLabel>
          <Select
            value={selectedFloorNumber}
            label="קומה"
            onChange={(event) => onFloorChange(String(event.target.value))}
          >
            <MenuItem value="">כל הקומות</MenuItem>
            {floors.map((floorNumber) => (
              <MenuItem key={floorNumber} value={String(floorNumber)}>
                {floorNumber}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth disabled={!selectedFloorNumber}>
          <InputLabel>דירה</InputLabel>
          <Select
            value={selectedListApartmentId}
            label="דירה"
            onChange={(event) => onApartmentChange(String(event.target.value))}
          >
            <MenuItem value="">כל הדירות</MenuItem>
            {apartmentsForSelectedFloor.map((apartment) => (
              <MenuItem key={apartment.id} value={apartment.id}>
                {formatApartmentLabel(apartment)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          placeholder="חיפוש לפי שם או טלפון"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          size="small"
          fullWidth
        />
      </Row>
      {isLoading ? (
        <Typography color="text.secondary">טעינה…</Typography>
      ) : filteredResidents.length === 0 ? (
        <Typography color="text.secondary">לא נמצאו תוצאות</Typography>
      ) : (
        <Column gap={1}>
          {visibleResidents.map((resident) => (
            <Row
              key={resident.id || `${resident.userId}-${resident.apartmentId}`}
              alignItems="center"
              justifyContent="space-between"
              sx={{
                borderRadius: 2,
                border: '1px solid rgba(226,232,240,0.7)',
                px: 1.5,
                py: 1,
                bgcolor:
                  resident.apartmentId === selectedApartmentId
                    ? 'rgba(99,102,241,0.12)'
                    : 'rgba(255,255,255,0.8)',
                cursor: 'pointer',
              }}
              onClick={() => onSelectApartment(resident.apartmentId)}
            >
              <Column>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {resident.user.name || 'דייר ללא שם'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {resident.user.phone}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatApartmentLabel(resident.apartment)}
                </Typography>
              </Column>
              {canManage && (
                <Row gap={0.5}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveResident(resident);
                    }}
                    disabled={!resident.id}
                  >
                    <SwapHorizRoundedIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteResident(resident);
                    }}
                    disabled={!resident.id}
                  >
                    <DeleteRoundedIcon fontSize="small" />
                  </IconButton>
                </Row>
              )}
            </Row>
          ))}
          {totalPages > 1 && (
            <Row alignItems="center" justifyContent="space-between" sx={{ pt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {`${(page - 1) * residentsPerPage + 1}-${Math.min(
                  page * residentsPerPage,
                  filteredResidents.length
                )} / ${filteredResidents.length}`}
              </Typography>
              <Row gap={0.5} alignItems="center">
                <IconButton
                  size="small"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  aria-label="previous resident page"
                >
                  <ArrowForwardIosRoundedIcon fontSize="inherit" />
                </IconButton>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 44, textAlign: 'center' }}>
                  {page} / {totalPages}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page === totalPages}
                  aria-label="next resident page"
                >
                  <ArrowBackIosNewRoundedIcon fontSize="inherit" />
                </IconButton>
              </Row>
            </Row>
          )}
        </Column>
      )}
    </Card>
  );
};
