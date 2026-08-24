import { createContext, useContext } from 'react';

interface DonateModalContextType {
  openDonate: () => void;
}

export const donateModalContext = createContext<DonateModalContextType>({ openDonate: () => {} });

export function useDonate() {
  return useContext(donateModalContext);
}