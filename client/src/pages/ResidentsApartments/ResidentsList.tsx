import { Resident } from '@entities/Resident';
import { Apartment } from '@entities/Apartment';
import { TextField, Typography, IconButton, Chip } from '@mui/material';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import { Row, Column, Card } from '@components/containers';
import { useMemo } from 'react';

interface ResidentsListProps {
  residents: Resident[];
  apartments: Apartment[];
  selectedApartmentId: string | null;
  search: string;
  isLoading: boolean;
  canManage: boolean;
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
  search,
  isLoading,
  canManage,
  onSearchChange,
  onSelectApartment,
  onMoveResident,
  onDeleteResident,
}: ResidentsListProps) => {
  const filteredResidents = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return residents;
    return residents.filter((resident) => {
      const label = formatApartmentLabel(resident.apartment).toLowerCase();
      const name = resident.user.name?.toLowerCase() || '';
      const phone = resident.user.phone.toLowerCase();
      return label.includes(term) || name.includes(term) || phone.includes(term);
    });
  }, [residents, search]);

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
      <TextField
        placeholder="חיפוש לפי שם, טלפון או דירה"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        size="small"
        fullWidth
        sx={{ mb: 2 }}
      />
      {isLoading ? (
        <Typography color="text.secondary">טעינה…</Typography>
      ) : filteredResidents.length === 0 ? (
        <Typography color="text.secondary">לא נמצאו תוצאות</Typography>
      ) : (
        <Column gap={1}>
          {filteredResidents.map((resident) => (
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
        </Column>
      )}
    </Card>
  );
};
