import { AuthContextData } from '../entities/AuthContextData';
import { ContextType } from '../enums/ContextType';

export interface RequestOtpRequest {
  phone: string;
}

export interface MessageResponse {
  message: string;
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
}

export interface VerifyOtpResponse {
  accessToken: string;
  contexts: AuthContextData[];
  needsProfileCompletion: boolean;
}

export interface CompleteProfileRequest {
  name: string;
}

export interface SelectContextRequest {
  type: ContextType;
  buildingId?: string;
  apartmentId?: string;
}

export interface SelectContextResponse {
  token: string;
}
