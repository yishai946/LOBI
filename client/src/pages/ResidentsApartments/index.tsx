import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apartmentService } from '@api/apartmentService';
import { residentService } from '@api/residentService';
import { useAuth } from '@providers/AuthContext';
import { useGlobalMessage } from '@providers/MessageProvider';
import { ContextType } from '@enums/ContextType';
import { Apartment } from '@entities/Apartment';
import { Resident } from '@entities/Resident';
import Banner from '@components/Banner';
import { Row, Column } from '@components/containers';
import { ApartmentGrid } from './ApartmentGrid';
import { ApartmentDetailsPanel } from './ApartmentDetailsPanel';
import { ResidentsList } from './ResidentsList';
import { ResidentFormDialogs } from './ResidentFormDialogs';
import { useApartmentResidentMutations } from '@hooks/mutations/useApartmentResidentMutations';

interface ApartmentFormValues {
  floorNumber: string;
  apartmentNumber: string;
}

interface CreateResidentFormValues {
  phone: string;
  apartmentId: string;
}

interface MoveResidentFormValues {
  apartmentId: string;
}

export const ResidentsApartmentsPage = () => {
  const { currentContext } = useAuth();
  const { showError, showSuccess } = useGlobalMessage();

  // Dialog state
  const [selectedApartmentId, setSelectedApartmentId] = useState<string | null>(null);
  const [selectedFloorNumber, setSelectedFloorNumber] = useState<string>('');
  const [selectedListApartmentId, setSelectedListApartmentId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [isCreateApartmentOpen, setIsCreateApartmentOpen] = useState(false);
  const [apartmentEditTarget, setApartmentEditTarget] = useState<Apartment | null>(null);
  const [apartmentDeleteTarget, setApartmentDeleteTarget] = useState<Apartment | null>(null);
  const [isCreateResidentOpen, setIsCreateResidentOpen] = useState(false);
  const [residentMoveTarget, setResidentMoveTarget] = useState<Resident | null>(null);
  const [residentDeleteTarget, setResidentDeleteTarget] = useState<Resident | null>(null);

  // Queries
  const { data: apartments = [], isLoading: apartmentsLoading } = useQuery({
    queryKey: ['apartments', 'list', currentContext?.buildingId],
    queryFn: () => apartmentService.getApartments({ limit: 200 }),
    enabled: Boolean(currentContext),
  });

  const { data: residents = [], isLoading: residentsLoading } = useQuery({
    queryKey: ['residents', 'list', currentContext?.buildingId],
    queryFn: () => residentService.getResidents({ limit: 200 }),
    enabled: Boolean(currentContext),
  });

  // Select first apartment on load
  useEffect(() => {
    if (!selectedApartmentId && apartments.length > 0) {
      setSelectedApartmentId(apartments[0].id);
    }
  }, [apartments, selectedApartmentId]);

  // Mutations
  const {
    createApartmentMutation,
    updateApartmentMutation,
    deleteApartmentMutation,
    createResidentMutation,
    moveResidentMutation,
    deleteResidentMutation,
  } = useApartmentResidentMutations(currentContext?.buildingId, {
    onSuccess: showSuccess,
    onError: (error, message) => showError(message),
    onSuccessDeleteApartment: () => {
      if (apartmentDeleteTarget?.id === selectedApartmentId) setSelectedApartmentId(null);
      setApartmentDeleteTarget(null);
    },
    onSuccessUpdateApartment: () => setApartmentEditTarget(null),
    onSuccessCreateApartment: () => {
      setIsCreateApartmentOpen(false);
    },
    onSuccessCreateResident: () => {
      setIsCreateResidentOpen(false);
    },
    onSuccessMoveResident: () => setResidentMoveTarget(null),
    onSuccessDeleteResident: () => setResidentDeleteTarget(null),
  });

  // Derived state
  const selectedApartment = apartments.find((apt) => apt.id === selectedApartmentId);
  const residentsByApartment = residents.reduce<Record<string, Resident[]>>((acc, resident) => {
    acc[resident.apartmentId] = acc[resident.apartmentId] || [];
    acc[resident.apartmentId].push(resident);
    return acc;
  }, {});
  const selectedApartmentResidents = selectedApartment
    ? residentsByApartment[selectedApartment.id] || []
    : [];

  const totalApartments = apartments.length;
  const totalResidents = residents.length;
  const vacantCount = apartments.filter(
    (apt) => (residentsByApartment[apt.id] || []).length === 0
  ).length;

  const canManage =
    currentContext?.type === ContextType.MANAGER || currentContext?.type === ContextType.ADMIN;

  return (
    <Column gap={3}>
      <Banner
        title="דיירים ודירות"
        subtitle={currentContext?.buildingName || 'בניין'}
        caption={`דירות: ${totalApartments} · דיירים: ${totalResidents} · פנויים: ${vacantCount}`}
      />

      <Row gap={3} direction={{ xs: 'column', md: 'row' }} sx={{ alignItems: 'stretch' }}>
        {/* Apartments Grid */}
        <ApartmentGrid
          apartments={apartments}
          residents={residents}
          selectedApartmentId={selectedApartmentId}
          isLoading={apartmentsLoading}
          onSelectApartment={setSelectedApartmentId}
        />

        {/* Right Panel */}
        <Column gap={2} sx={{ flex: 1.2, minWidth: { xs: '100%', md: 0 } }}>
          {/* Apartment Details */}
          <ApartmentDetailsPanel
            selectedApartment={selectedApartment}
            selectedApartmentResidents={selectedApartmentResidents}
            canManage={canManage}
            onCreateApartment={() => setIsCreateApartmentOpen(true)}
            onCreateResident={() => setIsCreateResidentOpen(true)}
            onEditApartment={setApartmentEditTarget}
            onDeleteApartment={setApartmentDeleteTarget}
            onMoveResident={setResidentMoveTarget}
            onDeleteResident={setResidentDeleteTarget}
          />

          {/* Residents List */}
          <ResidentsList
            residents={residents}
            apartments={apartments}
            selectedApartmentId={selectedApartmentId}
            selectedFloorNumber={selectedFloorNumber}
            selectedListApartmentId={selectedListApartmentId}
            search={search}
            isLoading={residentsLoading}
            canManage={canManage}
            onFloorChange={(floorNumber) => {
              setSelectedFloorNumber(floorNumber);
              setSelectedListApartmentId('');
            }}
            onApartmentChange={setSelectedListApartmentId}
            onSearchChange={setSearch}
            onSelectApartment={setSelectedApartmentId}
            onMoveResident={setResidentMoveTarget}
            onDeleteResident={setResidentDeleteTarget}
          />
        </Column>
      </Row>

      {/* Dialogs */}
      <ResidentFormDialogs
        apartments={apartments}
        isCreateApartmentOpen={isCreateApartmentOpen}
        apartmentEditTarget={apartmentEditTarget}
        apartmentDeleteTarget={apartmentDeleteTarget}
        isCreateResidentOpen={isCreateResidentOpen}
        residentMoveTarget={residentMoveTarget}
        residentDeleteTarget={residentDeleteTarget}
        isApartmentCreating={createApartmentMutation.isPending}
        isApartmentUpdating={updateApartmentMutation.isPending}
        isApartmentDeleting={deleteApartmentMutation.isPending}
        isResidentCreating={createResidentMutation.isPending}
        isResidentMoving={moveResidentMutation.isPending}
        isResidentDeleting={deleteResidentMutation.isPending}
        onCloseCreateApartment={() => setIsCreateApartmentOpen(false)}
        onCloseEditApartment={() => setApartmentEditTarget(null)}
        onCloseDeleteApartment={() => setApartmentDeleteTarget(null)}
        onCloseCreateResident={() => setIsCreateResidentOpen(false)}
        onCloseMoveResident={() => setResidentMoveTarget(null)}
        onCloseDeleteResident={() => setResidentDeleteTarget(null)}
        onSubmitCreateApartment={(values) => createApartmentMutation.mutate(values)}
        onSubmitEditApartment={(values) =>
          apartmentEditTarget &&
          updateApartmentMutation.mutate({ apartmentId: apartmentEditTarget.id, values })
        }
        onConfirmDeleteApartment={() => {
          if (apartmentDeleteTarget?.id) {
            deleteApartmentMutation.mutate(apartmentDeleteTarget.id);
          }
        }}
        onSubmitCreateResident={(values) => createResidentMutation.mutate(values)}
        onSubmitMoveResident={(values) => {
          if (residentMoveTarget?.id) {
            moveResidentMutation.mutate({ residentId: residentMoveTarget.id, values });
          }
        }}
        onConfirmDeleteResident={() => {
          if (residentDeleteTarget?.id) {
            deleteResidentMutation.mutate(residentDeleteTarget.id);
          }
        }}
      />
    </Column>
  );
};
