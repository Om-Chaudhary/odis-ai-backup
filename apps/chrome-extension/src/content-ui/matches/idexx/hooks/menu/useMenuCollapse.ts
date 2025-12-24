import { useState } from "react";

/**
 * Hook for managing menu collapse state
 */
export const useMenuCollapse = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  return {
    isCollapsed,
    toggleCollapse,
  };
};
