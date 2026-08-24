import { createContext, useContext } from 'react';

interface VolunteerModalContextType {
  openVolunteer: () => void;
}

export const volunteerModalContext = createContext<VolunteerModalContextType>({ openVolunteer: () => {} });

export function useVolunteer() {
  return useContext(volunteerModalContext);
}