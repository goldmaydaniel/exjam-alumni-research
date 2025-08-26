import { create } from "zustand";

interface Registration {
  id: string;
  userId: string;
  eventId: string;
  status: "pending" | "confirmed" | "cancelled";
  ticketType: string;
  createdAt: Date;
}

interface RegistrationState {
  registrations: Registration[];
  currentRegistration: Registration | null;
  isLoading: boolean;
  error: string | null;
  addRegistration: (registration: Registration) => void;
  removeRegistration: (id: string) => void;
  setCurrentRegistration: (registration: Registration | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearRegistrations: () => void;
}

export const useRegistrationStore = create<RegistrationState>((set) => ({
  registrations: [],
  currentRegistration: null,
  isLoading: false,
  error: null,
  addRegistration: (registration) =>
    set((state) => ({
      registrations: [...state.registrations, registration],
    })),
  removeRegistration: (id) =>
    set((state) => ({
      registrations: state.registrations.filter((r) => r.id !== id),
    })),
  setCurrentRegistration: (registration) => set({ currentRegistration: registration }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearRegistrations: () =>
    set({
      registrations: [],
      currentRegistration: null,
      error: null,
    }),
}));
