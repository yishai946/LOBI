export interface Message {
  id: string;
  buildingId: string;
  title: string;
  content: string;
  isUrgent: boolean;
  createdAt: string;
}