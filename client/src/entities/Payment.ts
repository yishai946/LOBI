export interface Payment {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  dueAt: string;
  createdAt: string;
}
