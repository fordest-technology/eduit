import { create } from "zustand";

interface School {
  id: string;
  name: string;
  subdomain: string;
  shortName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
}

interface SchoolStore {
  school: School | null;
  setSchool: (school: School) => void;
  clearSchool: () => void;
}

export const useSchoolStore = create<SchoolStore>((set) => ({
  school: null,
  setSchool: (school) => set({ school }),
  clearSchool: () => set({ school: null }),
}));
