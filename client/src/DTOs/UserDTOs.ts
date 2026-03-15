import { User } from '../entities/User';

export interface UpdateMeRequest {
  name: string;
}

export interface UpdateMeResponse {
  message: string;
  user: User;
}
