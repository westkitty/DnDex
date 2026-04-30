import { createContext, useContext } from 'react';

export const WorkspaceContext = createContext(null);

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
};
