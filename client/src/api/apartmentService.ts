import { Apartment } from '@entities/Apartment';
import { PaginationParams } from '@types/pagination';
import { axiosInstance } from './axiosInstance';

export interface CreateApartmentPayload {
  buildingId: string;
  floorNumber: number;
  apartmentNumber: string;
}

export interface UpdateApartmentPayload {
  floorNumber?: number;
  apartmentNumber?: string;
}

export const apartmentService = {
  getApartments: async (params: PaginationParams = {}): Promise<Apartment[]> => {
    const response = await axiosInstance.get('/apartments', { params });
    return response.data;
  },

  getApartmentById: async (id: string): Promise<Apartment> => {
    const response = await axiosInstance.get(`/apartments/${id}`);
    return response.data;
  },

  createApartment: async (payload: CreateApartmentPayload): Promise<Apartment> => {
    const response = await axiosInstance.post('/apartments', payload);
    return response.data.apartment;
  },

  updateApartment: async (apartmentId: string, payload: UpdateApartmentPayload): Promise<Apartment> => {
    const response = await axiosInstance.patch(`/apartments/${apartmentId}`, payload);
    return response.data.apartment;
  },

  deleteApartment: async (apartmentId: string): Promise<Apartment> => {
    const response = await axiosInstance.delete(`/apartments/${apartmentId}`);
    return response.data.apartment;
  },
};
