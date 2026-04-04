export interface Building {
  id: string;
  name: string | null;
  address: string;
  logoUrl: string | null;
  tier: 'FREE' | 'PRO' | 'ENTERPRISE';
  createdAt: string;
}
