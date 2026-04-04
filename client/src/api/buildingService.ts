import { axiosInstance } from './axiosInstance';

export type UpgradeFeature = 'DIGITAL_PAYMENTS';

export interface UpgradeRequestResponse {
  request: {
    id: string;
    buildingId: string;
    residentId: string;
    featureRequested: UpgradeFeature;
    createdAt: string;
  };
  totalRequests: number;
}

export interface UpgradeRequestSummary {
  buildingId: string;
  totalRequests: number;
}

export const buildingService = {
  requestUpgrade: async (featureRequested: UpgradeFeature): Promise<UpgradeRequestResponse> => {
    const response = await axiosInstance.post('/buildings/upgrade-request', { featureRequested });
    return response.data;
  },

  getUpgradeRequestSummary: async (buildingId: string): Promise<UpgradeRequestSummary> => {
    const response = await axiosInstance.get(`/buildings/${buildingId}/upgrade-request/summary`);
    return response.data;
  },
};
