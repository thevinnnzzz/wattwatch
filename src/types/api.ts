// API response types for WattWatch

// Base API response
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  success: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Re-export database enums for API use
export type { NotificationType } from './database';

// Appliance API types
export interface ApplianceRequest {
  name: string;
  category: string;
  wattage: number;
  hours_used_daily?: number;
  is_active?: boolean;
  icon_name?: string;
}

// Budget API types
export interface BudgetRequest {
  monthly_limit: number;
  alert_threshold_pct?: number;
}

// Dashboard API response type
export interface DashboardResponse {
  totalKwh: number;
  totalCost: number;
  budget: {
    limit: number;
    spent: number;
    percentage: number;
  };
  topConsumers: Array<{
    name: string;
    kwh: number;
    cost: number;
    percentageOfTotal: number;
  }>;
}

// Energy Log API types
export interface EnergyLogResponse {
  date: string;
  totalKwh: number;
  totalCost: number;
  appliances: Array<{
    name: string;
    kwh: number;
    cost: number;
  }>;
}

// Auth API types (can be reused, but keeping them here for clarity)
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  termsAccepted: boolean;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Settings API types
export interface UpdateSettingsRequest {
  darkMode?: boolean;
  pushNotifications?: boolean;
  emailNotifications?: boolean;
  budgetAlerts?: boolean;
  language?: string;
}
