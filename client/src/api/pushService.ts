import { axiosInstance } from './axiosInstance';

export interface PushSettings {
  notifyOnMessages: boolean;
  notifyOnIssues: boolean;
  notifyOnPayments: boolean;
}

export const pushService = {
  subscribe: async (subscription: any): Promise<void> => {
    await axiosInstance.post('/push/subscribe', subscription);
  },

  unsubscribe: async (endpoint: string): Promise<void> => {
    await axiosInstance.post('/push/unsubscribe', { endpoint });
  },

  getSettings: async (): Promise<PushSettings> => {
    const response = await axiosInstance.get('/push/settings');
    return response.data;
  },

  updateSettings: async (settings: Partial<PushSettings>): Promise<PushSettings> => {
    const response = await axiosInstance.put('/push/settings', settings);
    return response.data;
  },
};
