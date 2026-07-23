// TanStack Query (React Query) client configuration
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Query key factories for consistent caching
export const queryKeys = {
  // Auth
  auth: {
    session: ['auth', 'session'] as const,
    user: ['auth', 'user'] as const,
    profile: (userId: string) => ['auth', 'profile', userId] as const,
  },

  // WattWatch
  appliances: {
    all: (userId: string) => ['appliances', userId] as const,
    detail: (applianceId: string) => ['appliances', 'detail', applianceId] as const,
    catalog: () => ['appliances', 'catalog'] as const,
  },

  energy: {
    logs: (userId: string, from: string, to: string) => ['energy', 'logs', userId, from, to] as const,
    dashboard: (userId: string, excludeDemo = false) => ['energy', 'dashboard', userId, excludeDemo] as const,
    budget: (userId: string) => ['energy', 'budget', userId] as const,
    budgetAlert: (userId: string) => ['energy', 'budgetAlert', userId] as const,
    rate: () => ['energy', 'rate'] as const,
  },

  // Settings
  settings: {
    user: (userId: string) => ['settings', userId] as const,
  },

  notifications: {
    all: (userId: string) => ['notifications', 'all', userId] as const,
    unreadCount: (userId: string) => ['notifications', 'unreadCount', userId] as const,
  },

  admin: {
    config: () => ['admin', 'config'] as const,
    ratePlan: () => ['admin', 'ratePlan'] as const,
  },
};

// Helper to invalidate related queries
export const invalidateQueries = {
  all: () => queryClient.invalidateQueries(),
  auth: () => queryClient.invalidateQueries({ queryKey: ['auth'] }),
  appliances: (userId: string) => queryClient.invalidateQueries({ queryKey: ['appliances', userId] }),
  energy: (userId: string) => queryClient.invalidateQueries({ queryKey: ['energy', userId] }),
  settings: (userId: string) => queryClient.invalidateQueries({ queryKey: ['settings', userId] }),
};
