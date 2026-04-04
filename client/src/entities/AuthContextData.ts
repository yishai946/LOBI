import { ContextType } from '../enums/ContextType';

export interface AuthContextData {
  type: ContextType;
  buildingId?: string;
  apartmentId?: string;
  buildingName?: string | null;
  buildingTier?: 'FREE' | 'PRO' | 'ENTERPRISE';
}
