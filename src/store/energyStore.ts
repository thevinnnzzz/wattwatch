// Zustand store for energy-related state
import { create } from 'zustand';
import type { Appliance } from '@/types/database';

interface DashboardStats {
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

interface EnergyState {
  appliances: Appliance[];
  dashboard: DashboardStats;
  selectedAppliance: Appliance | null;
  loading: boolean;

  setAppliances: (appliances: Appliance[]) => void;
  addAppliance: (appliance: Appliance) => void;
  updateAppliance: (appliance: Appliance) => void;
  removeAppliance: (applianceId: string) => void;
  setDashboard: (dashboard: DashboardStats) => void;
  setSelectedAppliance: (appliance: Appliance | null) => void;
  setLoading: (loading: boolean) => void;
}

const initialDashboardState: DashboardStats = {
  totalKwh: 0,
  totalCost: 0,
  budget: {
    limit: 0,
    spent: 0,
    percentage: 0,
  },
  topConsumers: [],
};

export const useEnergyStore = create<EnergyState>()((set) => ({
  appliances: [],
  dashboard: initialDashboardState,
  selectedAppliance: null,
  loading: false,

  setAppliances: (appliances) => set({ appliances }),
  addAppliance: (appliance) => set((state) => ({ appliances: [...state.appliances, appliance] })),
  updateAppliance: (appliance) =>
    set((state) => ({
      appliances: state.appliances.map((a) => (a.id === appliance.id ? appliance : a)),
    })),
  removeAppliance: (applianceId) =>
    set((state) => ({
      appliances: state.appliances.filter((a) => a.id !== applianceId),
    })),
  setDashboard: (dashboard) => set({ dashboard }),
  setSelectedAppliance: (appliance) => set({ selectedAppliance: appliance }),
  setLoading: (loading) => set({ loading }),
}));
