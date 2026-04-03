export interface Message {
  id: string;
  buildingId: string;
  createdById: string;
  title: string;
  content: string;
  isUrgent: boolean;
  isPinned: boolean;
  createdAt: string;
}
