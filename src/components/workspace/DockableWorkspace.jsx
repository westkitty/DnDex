import React from 'react';

const DockableWorkspace = ({ children }) => {
  return (
    <div className="relative w-full h-full overflow-hidden" aria-label="Dockable Workspace">
      {children}
    </div>
  );
};

export default DockableWorkspace;
