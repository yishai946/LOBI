import { Resident } from '@entities/Resident';
import { PaginationParams } from '@types/pagination';
import { axiosInstance } from './axiosInstance';

export interface UpdateResidentPayload {
  apartmentId?: string;
}

export const residentService = {
  getResidents: async (params: PaginationParams = {}): Promise<Resident[]> => {
    const response = await axiosInstance.get('/residents', { params });
    return response.data;
  },

  updateResident: async (residentId: string, payload: UpdateResidentPayload): Promise<Resident> => {
    const response = await axiosInstance.patch(`/residents/${residentId}`, payload);
    return response.data.resident;
  },

  deleteResident: async (residentId: string): Promise<Resident> => {
    const response = await axiosInstance.delete(`/residents/${residentId}`);
    return response.data.resident;
  },
};
