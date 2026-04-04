import { Apartment } from './Apartment';
import { User } from './User';

export interface Resident {
  id: string | null;
  userId: string;
  apartmentId: string;
  user: User;
  apartment: Apartment;
}
