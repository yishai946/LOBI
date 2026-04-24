import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Chip,
  Divider,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import HomeWorkRoundedIcon from '@mui/icons-material/HomeWorkRounded';
import { Apartment } from '@entities/Apartment';
import { Resident } from '@entities/Resident';
import { Row, Column, Card } from '@components/containers';

interface ApartmentGridProps {
  apartments: Apartment[];
  residents: Resident[];
  selectedApartmentId: string | null;
  isLoading: boolean;
  onSelectApartment: (apartmentId: string) => void;
}

type ApartmentWithSort = Apartment & {
  derivedApartmentNumber: number;
};

const getSortValue = (value?: string): number => {
  if (!value) return 0;
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 0;
};

const formatApartmentLabel = (apartment: Apartment) => {
  const floor = apartment.floorNumber ?? '-';
  const number = apartment.apartmentNumber ?? '-';
  return `קומה ${floor} · דירה ${number}`;
};

export const ApartmentGrid = ({
  apartments,
  residents,
  selectedApartmentId,
  isLoading,
  onSelectApartment,
}: ApartmentGridProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const floorsPerPage = isMobile ? 3 : 5;
  const [page, setPage] = useState(1);

  const residentsByApartment = useMemo(() => {
    return residents.reduce<Record<string, Resident[]>>((acc, resident) => {
      acc[resident.apartmentId] = acc[resident.apartmentId] || [];
      acc[resident.apartmentId].push(resident);
      return acc;
    }, {});
  }, [residents]);

  const apartmentsByFloor = useMemo(() => {
    const groups = new Map<number, ApartmentWithSort[]>();
    apartments.forEach((apt, index) => {
      const floor = apt.floorNumber ?? 0;
      const list = groups.get(floor) || [];
      list.push({ ...apt, derivedApartmentNumber: getSortValue(apt.apartmentNumber) || index + 1 });
      groups.set(floor, list);
    });

    return Array.from(groups.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([floorNumber, list]) => ({
        floorNumber,
        apartments: list.sort(
          (a, b) => (a.derivedApartmentNumber as number) - (b.derivedApartmentNumber as number)
        ),
      }));
  }, [apartments]);

  const totalPages = Math.max(1, Math.ceil(apartmentsByFloor.length / floorsPerPage));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (!selectedApartmentId || apartmentsByFloor.length === 0) return;
    const selectedApartment = apartments.find((apartment) => apartment.id === selectedApartmentId);
    if (!selectedApartment) return;

    const floorIndex = apartmentsByFloor.findIndex(
      (floor) => floor.floorNumber === selectedApartment.floorNumber
    );
    if (floorIndex >= 0) {
      setPage(Math.floor(floorIndex / floorsPerPage) + 1);
    }
  }, [selectedApartmentId, apartments, apartmentsByFloor, floorsPerPage]);

  const visibleFloors = useMemo(
    () => apartmentsByFloor.slice((page - 1) * floorsPerPage, page * floorsPerPage),
    [apartmentsByFloor, page, floorsPerPage]
  );

  return (
    <Card sx={{ flex: 1.1, minWidth: { xs: '100%', md: 0 } }}>
      <Row alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Row alignItems="center" gap={1}>
          <HomeWorkRoundedIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            מפת הבניין
          </Typography>
        </Row>
        <Chip
          label={isLoading ? 'טעינה…' : `${apartments.length} דירות`}
          size="small"
          sx={{ bgcolor: 'rgba(123,94,167,0.1)', fontWeight: 700 }}
        />
      </Row>

      {isLoading ? (
        <Typography color="text.secondary">טוען דירות…</Typography>
      ) : apartments.length === 0 ? (
        <Typography color="text.secondary">אין דירות להצגה</Typography>
      ) : (
        <Column gap={2}>
          {visibleFloors.map((floor) => (
            <Box key={floor.floorNumber} sx={{ mb: 1 }}>
              <Row alignItems="center" gap={1} sx={{ mb: 1 }}>
                <Typography sx={{ fontWeight: 700 }}>קומה {floor.floorNumber}</Typography>
                <Divider sx={{ flex: 1, borderColor: 'rgba(148,163,184,0.4)' }} />
                <Typography variant="caption" color="text.secondary">
                  {floor.apartments.length} דירות
                </Typography>
              </Row>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(2, minmax(0, 1fr))',
                    sm: 'repeat(3, minmax(0, 1fr))',
                    md: 'repeat(4, minmax(0, 1fr))',
                  },
                  gap: 1,
                }}
              >
                {floor.apartments.map((apartment) => {
                  const residentsOfApt = residentsByApartment[apartment.id] || [];
                  const isOccupied = residentsOfApt.length > 0;
                  const isSelected = apartment.id === selectedApartmentId;
                  const occupant = residentsOfApt[0];
                  const occupantLabel = occupant?.user.name || occupant?.user.phone;

                  return (
                    <Box key={apartment.id}>
                      <Card
                        onClick={() => onSelectApartment(apartment.id)}
                        sx={{
                          cursor: 'pointer',
                          p: 1,
                          borderColor: isSelected
                            ? 'primary.main'
                            : isOccupied
                              ? 'success.main'
                              : 'divider',
                          bgcolor: isSelected
                            ? 'rgba(99,102,241,0.12)'
                            : isOccupied
                              ? 'rgba(16,185,129,0.08)'
                              : 'rgba(148,163,184,0.08)',
                        }}
                      >
                        <Column gap={0.5}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {formatApartmentLabel(apartment)}
                          </Typography>
                          <Chip
                            label={isOccupied ? 'מאוכלסת' : 'פנויה'}
                            size="small"
                            sx={{ fontWeight: 700 }}
                          />
                          {occupantLabel && (
                            <Typography variant="caption" color="text.secondary">
                              {occupantLabel}
                            </Typography>
                          )}
                        </Column>
                      </Card>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          ))}
          {totalPages > 1 && (
            <Row alignItems="center" justifyContent="space-between" sx={{ pt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {`${(page - 1) * floorsPerPage + 1}-${Math.min(
                  page * floorsPerPage,
                  apartmentsByFloor.length
                )} / ${apartmentsByFloor.length}`}
              </Typography>
              <Row gap={0.5} alignItems="center">
                <IconButton
                  size="small"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  aria-label="previous floor page"
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
                  aria-label="next floor page"
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
