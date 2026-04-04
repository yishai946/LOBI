import { Apartment } from '@entities/Apartment';
import { Resident } from '@entities/Resident';
import { ContextType } from '@enums/ContextType';
import { Button, Chip, Divider, IconButton, Typography } from '@mui/material';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { Row, Column, Card } from '@components/containers';

interface ApartmentDetailsPanelProps {
  selectedApartment: Apartment | undefined;
  selectedApartmentResidents: Resident[];
  canManage: boolean;
  onCreateApartment: () => void;
  onCreateResident: () => void;
  onEditApartment: (apartment: Apartment) => void;
  onDeleteApartment: (apartment: Apartment) => void;
  onMoveResident: (resident: Resident) => void;
  onDeleteResident: (resident: Resident) => void;
}

const formatApartmentLabel = (apartment: Apartment) => {
  const floor = apartment.floorNumber ?? '-';
  const number = apartment.apartmentNumber ?? '-';
  return `קומה ${floor} · דירה ${number}`;
};

export const ApartmentDetailsPanel = ({
  selectedApartment,
  selectedApartmentResidents,
  canManage,
  onCreateApartment,
  onCreateResident,
  onEditApartment,
  onDeleteApartment,
  onMoveResident,
  onDeleteResident,
}: ApartmentDetailsPanelProps) => {
  return (
    <Card>
      <Row alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Row alignItems="center" gap={1}>
          <ApartmentRoundedIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            דירה נבחרת
          </Typography>
        </Row>
        {canManage && (
          <Row gap={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddRoundedIcon />}
              onClick={onCreateApartment}
            >
              דירה חדשה
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<PersonAddRoundedIcon />}
              onClick={onCreateResident}
            >
              דייר חדש
            </Button>
          </Row>
        )}
      </Row>
      {selectedApartment ? (
        <Column gap={1.5}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {formatApartmentLabel(selectedApartment)}
          </Typography>
          <Row gap={1}>
            <Chip
              label={`דיירים: ${selectedApartmentResidents.length}`}
              size="small"
              sx={{ fontWeight: 700 }}
            />
            <Chip
              label={selectedApartmentResidents.length > 0 ? 'סטטוס: מאוכלסת' : 'סטטוס: פנויה'}
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Row>
          {canManage && (
            <Row gap={1}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditRoundedIcon />}
                onClick={() => onEditApartment(selectedApartment)}
              >
                ערוך
              </Button>
              <Button
                size="small"
                color="error"
                variant="contained"
                startIcon={<DeleteRoundedIcon />}
                onClick={() => onDeleteApartment(selectedApartment)}
              >
                מחק
              </Button>
            </Row>
          )}
          <Divider />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            דיירים בדירה
          </Typography>
          {selectedApartmentResidents.length === 0 ? (
            <Typography color="text.secondary">אין דיירים בדירה</Typography>
          ) : (
            <Column gap={1}>
              {selectedApartmentResidents.map((resident) => (
                <Row
                  key={resident.id || `${resident.userId}-${resident.apartmentId}`}
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    borderRadius: 2,
                    border: '1px solid rgba(226,232,240,0.9)',
                    p: 1.25,
                    bgcolor: 'rgba(255,255,255,0.7)',
                  }}
                >
                  <Column>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {resident.user.name || 'דייר ללא שם'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {resident.user.phone}
                    </Typography>
                  </Column>
                  {canManage && (
                    <Row gap={0.5}>
                      <IconButton
                        size="small"
                        onClick={() => onMoveResident(resident)}
                        disabled={!resident.id}
                      >
                        <SwapHorizRoundedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDeleteResident(resident)}
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
        </Column>
      ) : (
        <Typography color="text.secondary">בחר דירה להצגת פרטים</Typography>
      )}
    </Card>
  );
};
