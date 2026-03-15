import { Role } from '../enums/Role';

export interface User {
  id: string;
  phone: string;
  name: string | null;
  role: Role;
  isActive: boolean;
  otpCode: string | null;
  otpExpires: string | null;
  createdAt: string;
}
