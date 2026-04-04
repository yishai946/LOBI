import { Box, Chip, Divider, Typography } from '@mui/material';
import HomeWorkRoundedIcon from '@mui/icons-material/HomeWorkRounded';
import { Apartment } from '@entities/Apartment';
import { Resident } from '@entities/Resident';
import { Row, Column, Card } from '@components/containers';
import { useMemo } from 'react';

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
          {apartmentsByFloor.map((floor) => (
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
        </Column>
      )}
    </Card>
  );
};
