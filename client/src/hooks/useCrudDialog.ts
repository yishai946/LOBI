import { useState } from 'react';

interface UseCrudDialogOptions {
  onOpenCreate?: () => void;
  onCloseCreate?: () => void;
  onOpenEdit?: (item: any) => void;
  onCloseEdit?: () => void;
  onOpenDelete?: (item: any) => void;
  onCloseDelete?: () => void;
}

/**
 * Hook for managing CRUD dialog state (Create, Edit, Delete)
 * Provides consistent dialog state management across multiple pages
 */
export const useCrudDialog = <T>(options?: UseCrudDialogOptions) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<T | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);

  const openCreate = () => {
    setIsCreateOpen(true);
    options?.onOpenCreate?.();
  };

  const closeCreate = () => {
    setIsCreateOpen(false);
    options?.onCloseCreate?.();
  };

  const openEdit = (item: T) => {
    setEditTarget(item);
    options?.onOpenEdit?.(item);
  };

  const closeEdit = () => {
    setEditTarget(null);
    options?.onCloseEdit?.();
  };

  const openDelete = (item: T) => {
    setDeleteTarget(item);
    options?.onOpenDelete?.(item);
  };

  const closeDelete = () => {
    setDeleteTarget(null);
    options?.onCloseDelete?.();
  };

  return {
    // State
    isCreateOpen,
    editTarget,
    deleteTarget,

    // Actions
    openCreate,
    closeCreate,
    openEdit,
    closeEdit,
    openDelete,
    closeDelete,

    // State setters for advanced control
    setIsCreateOpen,
    setEditTarget,
    setDeleteTarget,
  };
};
