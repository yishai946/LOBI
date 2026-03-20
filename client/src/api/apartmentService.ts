import { Apartment } from '@entities/Apartment';
import { axiosInstance } from './axiosInstance';

export const apartmentService = {
  getApartmentById: async (id: string): Promise<Apartment> => {
    const response = await axiosInstance.get(`/apartments/${id}`);
    return response.data;
  },
};
